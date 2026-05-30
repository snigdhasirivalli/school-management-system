from django.urls import path
from .views import (
    add_student,
    get_students,
    get_student,
    update_student,
    delete_student,
    
    # Class routes
    manage_classes,
    manage_class_detail,
    
    # Section routes
    manage_sections,
    manage_section_detail,
    
    # Subject routes
    manage_subjects,
    manage_subject_detail,
    
    # Teacher routes
    manage_teachers,
    manage_teacher_detail,
)

urlpatterns = [
    # Students
    path('add/', add_student),
    path('all/', get_students),
    path('<int:id>/', get_student),
    path('update/<int:id>/', update_student),
    path('delete/<int:id>/', delete_student),
    
    # Classes & Sections
    path('classes/', manage_classes),
    path('classes/<int:pk>/', manage_class_detail),
    path('sections/', manage_sections),
    path('sections/<int:pk>/', manage_section_detail),
    
    # Subjects
    path('subjects/', manage_subjects),
    path('subjects/<int:pk>/', manage_subject_detail),
    
    # Teachers
    path('teachers/', manage_teachers),
    path('teachers/<int:pk>/', manage_teacher_detail),
]