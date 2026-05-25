from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.views.generic import TemplateView
from django.http import JsonResponse

def api_404(request, exception=None):
    return JsonResponse({'error': 'Not found'}, status=404)

def api_500(request):
    return JsonResponse({'error': 'Server error'}, status=500)

handler404 = 'core.urls.api_404'
handler500 = 'core.urls.api_500'

urlpatterns = [
    path('api/auth/', include('accounts.urls')),
    path('api/events/', include('events.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/integrations/', include('integrations.urls')),
    path('api/adkrish/', include('admin_panel.urls')),
    path('robots.txt', TemplateView.as_view(template_name='robots.txt', content_type='text/plain')),
    re_path(r'^api/.*$', api_404, name='api_catch_all'),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    ]
