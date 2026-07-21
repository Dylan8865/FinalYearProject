from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.db.supabase import get_supabase


class CollectionService:
    @staticmethod
    def _owned_target(educator_id: str, item_type: str, target_id: str) -> bool:
        table, id_column, owner_column = {
            'model': ('resources', 'resource_id', 'created_by'),
            'video': ('videos', 'video_id', 'uploaded_by'),
            'quiz': ('quizzes', 'id', 'owner_id'),
        }[item_type]
        rows = (
            get_supabase().table(table).select(id_column)
            .eq(id_column, target_id).eq(owner_column, educator_id).limit(1).execute().data
            or []
        )
        return bool(rows)

    @staticmethod
    def add_uploaded_item(educator_id: str, item_type: str, target_id: str) -> None:
        """Keep newly published educator content in one editable draft collection."""
        supabase = get_supabase()
        collection_rows = (
            supabase.table('collections')
            .select('collection_id')
            .eq('educator_id', educator_id)
            .eq('title', 'My uploaded content')
            .eq('status', 'draft')
            .limit(1)
            .execute()
            .data
            or []
        )
        collection = collection_rows[0] if collection_rows else None
        if not collection:
            collection = supabase.table('collections').insert({
                'educator_id': educator_id,
                'title': 'My uploaded content',
                'description': 'Resources you have published and can organise into teaching packs.',
                'status': 'draft',
            }).execute().data[0]
        target_column = {'video': 'video_id', 'model': 'resource_id', 'quiz': 'quiz_id'}[item_type]
        existing_rows = (
            supabase.table('collection_items')
            .select('collection_item_id')
            .eq('collection_id', collection['collection_id'])
            .eq(target_column, target_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        existing = existing_rows[0] if existing_rows else None
        if existing:
            return
        current_count = supabase.table('collection_items').select('collection_item_id', count='exact').eq('collection_id', collection['collection_id']).execute().count or 0
        supabase.table('collection_items').insert({'collection_id': collection['collection_id'], 'item_type': item_type, target_column: target_id, 'sort_order': current_count}).execute()
        supabase.table('collections').update({'updated_at': datetime.now(timezone.utc).isoformat()}).eq('collection_id', collection['collection_id']).execute()

    @staticmethod
    def _owner_collection(collection_id: str, educator_id: str) -> dict:
        rows = (
            get_supabase().table('collections')
            .select('*')
            .eq('collection_id', collection_id)
            .eq('educator_id', educator_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        collection = rows[0] if rows else None
        if not collection:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Collection not found or not owned by this educator.')
        return collection

    @staticmethod
    def _serialize(row: dict) -> dict:
        subject = row.get('subjects') or {}
        return {**row, 'primary_subject_name': subject.get('subject_name')}

    @classmethod
    def list_mine(cls, educator_id: str, status_filter: str | None = None) -> list[dict]:
        query = get_supabase().table('collections').select('*,subjects(subject_name)').eq('educator_id', educator_id).order('updated_at', desc=True)
        if status_filter:
            query = query.eq('status', status_filter)
        rows = query.execute().data or []
        return [cls._serialize(row) for row in rows]

    @classmethod
    def create(cls, educator_id: str, payload: dict) -> dict:
        data = {**payload, 'educator_id': educator_id, 'status': 'draft'}
        row = get_supabase().table('collections').insert(data).execute().data
        return cls._serialize(row[0])

    @classmethod
    def update(cls, collection_id: str, educator_id: str, payload: dict) -> dict:
        collection = cls._owner_collection(collection_id, educator_id)
        if collection['status'] != 'draft':
            raise HTTPException(status_code=409, detail='Shared collections are immutable. Duplicate a new version to edit.')
        row = get_supabase().table('collections').update({**payload, 'updated_at': datetime.now(timezone.utc).isoformat()}).eq('collection_id', collection_id).execute().data
        return cls._serialize(row[0])

    @classmethod
    def add_item(cls, collection_id: str, educator_id: str, payload: dict) -> dict:
        collection = cls._owner_collection(collection_id, educator_id)
        if collection['status'] != 'draft':
            raise HTTPException(status_code=409, detail='Only draft collections can be edited.')
        if not cls._owned_target(educator_id, payload['item_type'], str(payload['target_id'])):
            raise HTTPException(status_code=403, detail='Only your own videos, 3D models, and quizzes can be added to a collection.')
        target_column = {'video': 'video_id', 'model': 'resource_id', 'quiz': 'quiz_id'}[payload['item_type']]
        item = {'collection_id': collection_id, 'item_type': payload['item_type'], target_column: payload['target_id'], 'sort_order': payload['sort_order']}
        row = get_supabase().table('collection_items').insert(item).execute().data
        get_supabase().table('collections').update({'updated_at': datetime.now(timezone.utc).isoformat()}).eq('collection_id', collection_id).execute()
        return row[0]

    @classmethod
    def editor_data(cls, collection_id: str, educator_id: str) -> dict:
        collection = cls._owner_collection(collection_id, educator_id)
        rows = (
            get_supabase().table('collection_items')
            .select('collection_item_id,item_type,video_id,resource_id,quiz_id,sort_order')
            .eq('collection_id', collection_id).order('sort_order').execute().data
            or []
        )
        models = {row['resource_id']: row for row in get_supabase().table('resources').select('resource_id,title,topics(topic_name,subjects(subject_name))').in_('resource_id', [item['resource_id'] for item in rows if item.get('resource_id')] or ['00000000-0000-0000-0000-000000000000']).execute().data or []}
        videos = {row['video_id']: row for row in get_supabase().table('videos').select('video_id,title,subject_tag').in_('video_id', [item['video_id'] for item in rows if item.get('video_id')] or ['00000000-0000-0000-0000-000000000000']).execute().data or []}
        quizzes = {row['id']: row for row in get_supabase().table('quizzes').select('id,title,subjects(subject_name)').in_('id', [item['quiz_id'] for item in rows if item.get('quiz_id')] or ['00000000-0000-0000-0000-000000000000']).execute().data or []}
        items = []
        for item in rows:
            target_id = item.get('resource_id') or item.get('video_id') or item.get('quiz_id')
            source = models.get(target_id) or videos.get(target_id) or quizzes.get(target_id) or {}
            topic = source.get('topics') or {}
            subject = topic.get('subjects') or source.get('subjects') or {}
            items.append({**item, 'target_id': target_id, 'title': source.get('title', 'Unavailable item'), 'subject_name': source.get('subject_tag') or subject.get('subject_name') or topic.get('topic_name')})
        return {'collection': cls._serialize(collection), 'items': items}

    @staticmethod
    def content_options(educator_id: str) -> list[dict]:
        supabase = get_supabase()
        models = supabase.table('resources').select('resource_id,title,topics(topic_name,subjects(subject_name))').in_('resource_type', ['3d_model', '3D Model']).eq('created_by', educator_id).order('title').execute().data or []
        videos = supabase.table('videos').select('video_id,title,subject_tag').eq('uploaded_by', educator_id).order('title').execute().data or []
        quizzes = supabase.table('quizzes').select('id,title,subjects(subject_name)').eq('owner_id', educator_id).order('created_at', desc=True).execute().data or []
        result = []
        for model in models:
            topic = model.get('topics') or {}; subject = topic.get('subjects') or {}
            result.append({'item_type': 'model', 'target_id': model['resource_id'], 'title': model['title'], 'subject_name': subject.get('subject_name') or topic.get('topic_name')})
        result.extend({'item_type': 'video', 'target_id': video['video_id'], 'title': video['title'], 'subject_name': video.get('subject_tag')} for video in videos)
        result.extend({'item_type': 'quiz', 'target_id': quiz['id'], 'title': quiz['title'], 'subject_name': (quiz.get('subjects') or {}).get('subject_name')} for quiz in quizzes)
        return result

    @classmethod
    def remove_item(cls, collection_id: str, collection_item_id: str, educator_id: str) -> None:
        collection = cls._owner_collection(collection_id, educator_id)
        if collection['status'] != 'draft':
            raise HTTPException(status_code=409, detail='Only draft collections can be edited.')
        deleted = get_supabase().table('collection_items').delete().eq('collection_item_id', collection_item_id).eq('collection_id', collection_id).execute().data or []
        if not deleted:
            raise HTTPException(status_code=404, detail='Collection item not found.')
        get_supabase().table('collections').update({'updated_at': datetime.now(timezone.utc).isoformat()}).eq('collection_id', collection_id).execute()

    @classmethod
    def share(cls, collection_id: str, educator_id: str, payload: dict) -> None:
        collection = cls._owner_collection(collection_id, educator_id)
        if collection['status'] != 'draft':
            raise HTTPException(status_code=409, detail='Only draft collections can be shared.')
        linked = get_supabase().table('educator_students').select('student_id').eq('educator_id', educator_id).in_('student_id', payload['student_ids']).execute().data or []
        allowed = {row['student_id'] for row in linked}
        requested = {str(student_id) for student_id in payload['student_ids']}
        if allowed != requested:
            raise HTTPException(status_code=403, detail='Collections can only be shared with linked students.')
        rows = [{'collection_id': collection_id, 'student_id': student_id, 'shared_by': educator_id, 'message': payload.get('message'), 'due_at': payload.get('due_at')} for student_id in requested]
        get_supabase().table('collection_shares').upsert(rows, on_conflict='collection_id,student_id').execute()
        get_supabase().table('collections').update({'status': 'shared', 'updated_at': datetime.now(timezone.utc).isoformat()}).eq('collection_id', collection_id).execute()

    @classmethod
    def archive(cls, collection_id: str, educator_id: str) -> None:
        cls._owner_collection(collection_id, educator_id)
        get_supabase().table('collections').update({'status': 'archived', 'archived_at': datetime.now(timezone.utc).isoformat(), 'updated_at': datetime.now(timezone.utc).isoformat()}).eq('collection_id', collection_id).execute()

    @classmethod
    def duplicate(cls, collection_id: str, educator_id: str) -> dict:
        source = cls._owner_collection(collection_id, educator_id)
        clone = get_supabase().table('collections').insert({'educator_id': educator_id, 'title': f"{source['title']} (v{source.get('version', 1) + 1})", 'description': source['description'], 'primary_subject_id': source.get('primary_subject_id'), 'status': 'draft', 'source_collection_id': collection_id, 'version': source.get('version', 1) + 1}).execute().data[0]
        items = get_supabase().table('collection_items').select('item_type,video_id,resource_id,quiz_id,sort_order').eq('collection_id', collection_id).order('sort_order').execute().data or []
        if items:
            get_supabase().table('collection_items').insert([{**item, 'collection_id': clone['collection_id']} for item in items]).execute()
        return cls._serialize(clone)

    @staticmethod
    def linked_students(educator_id: str) -> list[dict]:
        rows = get_supabase().table('educator_students').select('student_id,profiles!educator_students_student_id_fkey(id,full_name,username,email)').eq('educator_id', educator_id).execute().data or []
        return [row['profiles'] for row in rows if row.get('profiles')]
