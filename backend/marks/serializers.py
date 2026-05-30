from rest_framework import serializers
from .models import Mark


class MarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.username', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Mark
        fields = '__all__'