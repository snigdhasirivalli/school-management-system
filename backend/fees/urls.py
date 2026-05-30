from django.urls import path

from .views import (
    add_fee,
    get_fees,
)

urlpatterns = [

    path('add/', add_fee),

    path('all/', get_fees),
]