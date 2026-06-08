import random


def generate_otp():
    return str(random.randint(100000, 999999))


def log_action(user, action, details=None, request=None):
    from .models import AuditLog
    ip_address = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')

    AuditLog.objects.create(
        actor=user if (user and user.is_authenticated) else None,
        action=action,
        details=details,
        ip_address=ip_address
    )