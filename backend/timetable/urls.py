from django.urls import path

from .views import (
    add_timetable,
    get_timetable,
)

urlpatterns = [

    path('add/', add_timetable),

    path('all/', get_timetable),
]