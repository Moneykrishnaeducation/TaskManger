from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
import os
from api.views import SPAView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Serve assets from backend static folder
urlpatterns += [
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': os.path.join(settings.STATIC_ROOT, 'assets')}),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
]

# Catchall for SPA - must be last. Exclude API and static/asset paths to avoid returning
# the SPA HTML for API requests.
urlpatterns.append(re_path(r'^(?!api/|assets/|static/).*$', SPAView.as_view()))
