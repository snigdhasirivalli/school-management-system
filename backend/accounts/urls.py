from django.urls import path

from .views import (
    register_user,
    verify_otp,
    set_password,
    profile,
    get_audit_logs,
    update_profile,
)

urlpatterns = [

    path('register/', register_user),

    path('verify-otp/', verify_otp),

    path('set-password/', set_password),

    path('profile/', profile),

    path('audit-logs/', get_audit_logs),

    path('update-profile/', update_profile),
]