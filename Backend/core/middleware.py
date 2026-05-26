from django.conf import settings


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if not settings.DEBUG:
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "script-src 'self' https://checkout.razorpay.com https://fonts.googleapis.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "img-src 'self' data:; "
                "font-src 'self' https://fonts.gstatic.com; "
                "connect-src 'self' https://api.yourcaly.com; "
                "frame-src https://checkout.razorpay.com; "
                "object-src 'none'"
            )
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            response['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        return response
