HTML_WRAP = """<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f9;padding:40px 16px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
<tr><td style="padding:36px 36px 0">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td><h1 style="margin:0;font-size:22px;font-weight:800;color:#1a1a2e;letter-spacing:-0.3px">Caly</h1></td>
<td align="right"><span style="font-size:12px;color:#aaa">Scheduling</span></td>
</tr></table>
<hr style="border:none;border-top:2px solid #f0f0f6;margin:16px 0 24px">
</td></tr>
<tr><td style="padding:0 36px 32px;font-size:15px;line-height:1.7;color:#333">{body}</td></tr>
<tr><td style="padding:20px 36px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center;line-height:1.6">
Caly — Modern Scheduling<br>
<span style="font-size:11px;color:#bbb">If you didn't request this, you can safely ignore this email.</span>
</td></tr></table></td></tr></table></body></html>"""


import html

def detail_rows(items):
    rows = ''
    for i, (label, value) in enumerate(items):
        bg = '#fafafa' if i % 2 == 0 else '#ffffff'
        rows += f'''<tr style="background:{bg}">
<td style="padding:10px 14px;font-size:13px;color:#888;width:110px;vertical-align:top;border-bottom:1px solid #f0f0f0">{html.escape(label)}</td>
<td style="padding:10px 14px;font-size:14px;color:#222;font-weight:600;border-bottom:1px solid #f0f0f0">{html.escape(str(value))}</td>
</tr>'''
    return rows


def detail_table(rows_html):
    return f'''<table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #eee;margin:0 0 20px">
{rows_html}</table>'''
