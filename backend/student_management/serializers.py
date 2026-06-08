from rest_framework import serializers
from .models import Student, SchoolClass, Section, Subject, Teacher
from accounts.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'role']


class SectionSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'name', 'school_class', 'class_name']


class SchoolClassSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolClass
        fields = ['id', 'name', 'sections']


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name']


class TeacherSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    subject_details = SubjectSerializer(source='subjects', many=True, read_only=True)
    class_details = SchoolClassSerializer(source='classes', many=True, read_only=True)
    section_details = SectionSerializer(source='sections', many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    class_name = serializers.SerializerMethodField()
    section_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = '__all__'

    def get_class_name(self, obj):
        return obj.school_class.name if obj.school_class else None

    def get_section_name(self, obj):
        return obj.section.name if obj.section else None