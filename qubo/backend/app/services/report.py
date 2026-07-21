from io import BytesIO
from typing import List

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class ProgressReportService:
    """Render a polished bilingual-ready student progress report."""

    BLUE = colors.HexColor("#2563EB")
    NAVY = colors.HexColor("#0F172A")
    SLATE = colors.HexColor("#475569")
    PALE = colors.HexColor("#F1F5F9")
    RED = colors.HexColor("#DC2626")
    GREEN = colors.HexColor("#059669")

    @staticmethod
    def _labels(language: str):
        if language == "ms":
            return {
                "title": "Laporan Kemajuan Pelajar",
                "subtitle": "Analitik pembelajaran Qubo AI",
                "generated": "Dijana",
                "student": "Pelajar",
                "school": "Sekolah",
                "form": "Tingkatan",
                "target": "Sasaran",
                "summary": "Ringkasan keseluruhan",
                "subjects": "Subjek aktif",
                "study": "Masa belajar",
                "quizzes": "Kuiz selesai",
                "warnings": "Amaran awal",
                "performance": "Prestasi subjek",
                "subject": "Subjek",
                "mastery": "Penguasaan",
                "forecast": "Ramalan",
                "velocity": "Halaju (mata/minggu)",
                "sessions": "Sesi pembelajaran terkini",
                "topic": "Topik",
                "duration": "Tempoh",
                "date": "Tarikh",
                "review": "Jadual ulang kaji berjarak",
                "next_review": "Ulang kaji seterusnya",
                "interval": "Selang",
                "score": "Skor terakhir",
                "none": "Belum ada data",
                "risk": "Ramalan di bawah ambang amaran pelajar.",
                "days": "hari",
                "minutes": "minit",
                "page": "Muka surat",
            }
        return {
            "title": "Student Progress Report",
            "subtitle": "Qubo AI learning analytics",
            "generated": "Generated",
            "student": "Student",
            "school": "School",
            "form": "Form level",
            "target": "Target grade",
            "summary": "Overall summary",
            "subjects": "Active subjects",
            "study": "Study time",
            "quizzes": "Quizzes completed",
            "warnings": "Early warnings",
            "performance": "Subject performance",
            "subject": "Subject",
            "mastery": "Mastery",
            "forecast": "Forecast",
            "velocity": "Velocity (pts/week)",
            "sessions": "Recent study sessions",
            "topic": "Topic",
            "duration": "Duration",
            "date": "Date",
            "review": "Spaced-repetition schedule",
            "next_review": "Next review",
            "interval": "Interval",
            "score": "Last score",
            "none": "No data yet",
            "risk": "Forecast is below the student's warning threshold.",
            "days": "days",
            "minutes": "minutes",
            "page": "Page",
        }

    @staticmethod
    def render(profile: dict, subjects: List[dict], sessions: List[dict], schedule: List[dict], language: str, generated_at: str) -> bytes:
        labels = ProgressReportService._labels(language)
        buffer = BytesIO()
        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=20 * mm,
            bottomMargin=18 * mm,
            title=f"Qubo AI - {labels['title']}",
            author="Qubo AI",
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("ReportTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=24, leading=29, textColor=ProgressReportService.NAVY, alignment=TA_LEFT, spaceAfter=3 * mm)
        subtitle_style = ParagraphStyle("ReportSubtitle", parent=styles["Normal"], fontName="Helvetica", fontSize=10, leading=15, textColor=ProgressReportService.SLATE, spaceAfter=7 * mm)
        heading_style = ParagraphStyle("ReportHeading", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=ProgressReportService.NAVY, spaceBefore=5 * mm, spaceAfter=3 * mm)
        body_style = ParagraphStyle("ReportBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=9, leading=13, textColor=ProgressReportService.SLATE)
        small_style = ParagraphStyle("ReportSmall", parent=body_style, fontSize=8, leading=11)

        story = [
            Paragraph("QUBO AI", ParagraphStyle("Brand", parent=small_style, fontName="Helvetica-Bold", textColor=ProgressReportService.BLUE, spaceAfter=2 * mm)),
            Paragraph(labels["title"], title_style),
            Paragraph(f"{labels['subtitle']} &nbsp;&nbsp;|&nbsp;&nbsp; {labels['generated']}: {generated_at}", subtitle_style),
        ]

        profile_data = [
            [labels["student"], profile.get("full_name") or profile.get("username") or "-", labels["school"], profile.get("school") or "-"],
            [labels["form"], profile.get("form_level") or "-", labels["target"], profile.get("target_grade") or "-"],
        ]
        profile_table = Table(profile_data, colWidths=[28 * mm, 57 * mm, 28 * mm, 57 * mm])
        profile_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), ProgressReportService.PALE),
            ("TEXTCOLOR", (0, 0), (-1, -1), ProgressReportService.NAVY),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.extend([profile_table, Paragraph(labels["summary"], heading_style)])

        total_minutes = sum(int(item.get("study_minutes") or 0) for item in subjects)
        total_quizzes = sum(int(item.get("quizzes_completed") or 0) for item in subjects)
        warnings = sum(1 for item in subjects if item.get("latest_prediction") and item["latest_prediction"].get("is_warning"))
        summary_data = [
            [str(len(subjects)), str(total_minutes), str(total_quizzes), str(warnings)],
            [labels["subjects"], labels["study"], labels["quizzes"], labels["warnings"]],
        ]
        summary_table = Table(summary_data, colWidths=[42.5 * mm] * 4)
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 18),
            ("TEXTCOLOR", (0, 0), (-1, 0), ProgressReportService.BLUE),
            ("FONTNAME", (0, 1), (-1, 1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, 1), 8),
            ("TEXTCOLOR", (0, 1), (-1, 1), ProgressReportService.SLATE),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.extend([summary_table, Paragraph(labels["performance"], heading_style)])

        performance_rows = [[labels["subject"], labels["mastery"], labels["forecast"], labels["velocity"]]]
        for subject in subjects:
            prediction = subject.get("latest_prediction")
            performance_rows.append([
                Paragraph(subject.get("subject_name", "-"), small_style),
                "-" if subject.get("overall_mastery") is None else f"{round(float(subject['overall_mastery']))}%",
                "-" if not prediction else f"{round(float(prediction['predicted_score']))}%",
                "-" if subject.get("learning_velocity") is None else f"{float(subject['learning_velocity']):+.1f}",
            ])
        if len(performance_rows) == 1:
            performance_rows.append([labels["none"], "-", "-", "-"])
        performance_table = Table(performance_rows, colWidths=[75 * mm, 30 * mm, 30 * mm, 35 * mm], repeatRows=1)
        performance_table.setStyle(ProgressReportService._data_table_style())
        story.append(performance_table)

        warning_subjects = [item for item in subjects if item.get("latest_prediction") and item["latest_prediction"].get("is_warning")]
        if warning_subjects:
            warning_text = "<br/>".join(
                f"<b>{item['subject_name']}:</b> {round(float(item['latest_prediction']['predicted_score']))}% - {labels['risk']}"
                for item in warning_subjects
            )
            story.extend([
                Spacer(1, 4 * mm),
                Table([[Paragraph(warning_text, body_style)]], colWidths=[170 * mm], style=TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF2F2")),
                    ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#FCA5A5")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                ])),
            ])

        session_rows = [[labels["date"], labels["subject"], labels["topic"], labels["duration"]]]
        for session in sessions[:10]:
            session_rows.append([
                str(session.get("session_date", ""))[:10],
                Paragraph(session.get("subject_name", "-"), small_style),
                Paragraph(session.get("topic_name", "-"), small_style),
                f"{session.get('duration_minutes', 0)} {labels['minutes']}",
            ])
        if len(session_rows) == 1:
            session_rows.append([labels["none"], "-", "-", "-"])
        story.extend([Paragraph(labels["sessions"], heading_style), Table(session_rows, colWidths=[30 * mm, 43 * mm, 67 * mm, 30 * mm], repeatRows=1, style=ProgressReportService._data_table_style())])

        review_rows = [[labels["subject"], labels["topic"], labels["next_review"], labels["interval"], labels["score"]]]
        for item in schedule[:12]:
            review_rows.append([
                Paragraph(item.get("subject_name", "-"), small_style),
                Paragraph(item.get("topic_name", "-"), small_style),
                str(item.get("next_review_date", "-")),
                f"{item.get('interval_days', 0)} {labels['days']}",
                "-" if item.get("last_score") is None else f"{round(float(item['last_score']))}%",
            ])
        if len(review_rows) == 1:
            review_rows.append([labels["none"], "-", "-", "-", "-"])
        story.extend([Paragraph(labels["review"], heading_style), Table(review_rows, colWidths=[37 * mm, 53 * mm, 32 * mm, 25 * mm, 23 * mm], repeatRows=1, style=ProgressReportService._data_table_style())])

        def draw_page(canvas, doc):
            canvas.saveState()
            canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
            canvas.line(18 * mm, 13 * mm, 192 * mm, 13 * mm)
            canvas.setFont("Helvetica", 8)
            canvas.setFillColor(ProgressReportService.SLATE)
            canvas.drawString(18 * mm, 8 * mm, "Qubo AI - SPM Mastery")
            canvas.drawRightString(192 * mm, 8 * mm, f"{labels['page']} {doc.page}")
            canvas.restoreState()

        document.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
        return buffer.getvalue()

    @staticmethod
    def _data_table_style():
        return TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), ProgressReportService.NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ProgressReportService.PALE]),
            ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
