from django.urls import path

from .views import (
    send_notification,
    get_notifications,
)

urlpatterns = [

    path('send/', send_notification),

    path('all/', get_notifications),
]