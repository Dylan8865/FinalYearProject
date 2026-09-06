import sys
from app.core.supabase import get_supabase

def test():
    try:
        s = get_supabase()
        res = s.table('quiz_assignments').select('*').limit(1).execute()
        print('quiz_assignments exists, data:', res.data)
    except Exception as e:
        print('ERROR quiz_assignments:', str(e))

if __name__ == '__main__':
    test()
