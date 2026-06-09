from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [

    path('admin/', admin.site.urls),

    path('api/', include('accounts.urls')),

    path(
        'api/students/',
        include('student_management.urls')
    ),

    path(
        'api/attendance/',
        include('attendance.urls')
    ),

    path(
        'api/login/',
        TokenObtainPairView.as_view()
    ),

    path(
        'api/token/refresh/',
        TokenRefreshView.as_view()
    ),

    path(
    'api/marks/',
    include('marks.urls')
),

    path(
    'api/timetable/',
    include('timetable.urls')
),

path(
    'api/fees/',
    include('fees.urls')
),

    path(
    'api/notifications/',
    include('notifications.urls')
),

    # API Documentation & Schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]