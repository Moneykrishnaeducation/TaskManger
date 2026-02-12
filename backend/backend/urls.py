"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Change Django admin path to avoid colliding with frontend `/admin/*` SPA routes.
    # Access the Django admin at `/djadmin/` now.
    path('djadmin/', admin.site.urls),
    path('api/', include('api.urls')),
    # SPA entry — ensure `static/index.html` exists (copy React build here)
    re_path(r'^', TemplateView.as_view(template_name='index.html')),
]

# Serve static files during development (DEBUG=True).
if settings.DEBUG:
    try:
        document_root = settings.STATICFILES_DIRS[0]
    except Exception:
        document_root = None
    if document_root:
        urlpatterns += static(settings.STATIC_URL, document_root=document_root)