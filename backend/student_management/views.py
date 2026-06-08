from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdmin
from accounts.models import User
from accounts.utils import log_action
from django.db import transaction

from .models import Student, SchoolClass, Section, Subject, Teacher
from .serializers import (
    StudentSerializer,
    SchoolClassSerializer,
    SectionSerializer,
    SubjectSerializer,
    TeacherSerializer
)


# STUDENT CRUD VIEWS
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def add_student(request):
    data = request.data.copy()

    # Check if we should create a new user dynamically
    if 'email' in data and 'username' in data and 'password' in data:
        email = data.get('email')
        username = data.get('username')
        phone = data.get('phone', '')
        password = data.get('password')

        try:
            with transaction.atomic():
                if User.objects.filter(email=email).exists():
                    user = User.objects.get(email=email)
                else:
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        phone=phone,
                        role='student',
                        is_verified=True,
                        is_active=True
                    )
                    user.set_password(password)
                    user.save()

                data['user'] = user.id
                serializer = StudentSerializer(data=data)
                if serializer.is_valid():
                    student = serializer.save()
                    log_action(
                        user=request.user,
                        action="CREATE_STUDENT",
                        details=f"Created student with username: {username}, email: {email} (Admission: {student.admission_number})",
                        request=request
                    )
                    return Response({
                        "message": "Student added successfully"
                    }, status=status.HTTP_201_CREATED)
                else:
                    transaction.set_rollback(True)
                    return Response(
                        serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        # Standard creation
        serializer = StudentSerializer(data=request.data)
        if serializer.is_valid():
            student = serializer.save()
            log_action(
                user=request.user,
                action="CREATE_STUDENT",
                details=f"Created student: {student.user.username if student.user else 'No User'} under standard flow (Admission: {student.admission_number})",
                request=request
            )
            return Response({
                "message": "Student added successfully"
            }, status=status.HTTP_201_CREATED)
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_students(request):
    # Support class and section filtering
    school_class_id = request.query_params.get('school_class')
    section_id = request.query_params.get('section')
    
    students = Student.objects.select_related('user', 'school_class', 'section').all()
    
    # Role-based restriction
    if request.user.role == 'student':
        if hasattr(request.user, 'student_profile'):
            students = students.filter(id=request.user.student_profile.id)
        else:
            return Response([])
    elif request.user.role == 'teacher':
        if hasattr(request.user, 'teacher_profile'):
            teacher = request.user.teacher_profile
            students = students.filter(
                school_class__in=teacher.classes.all(),
                section__in=teacher.sections.all()
            )
        else:
            return Response([])
            
        if school_class_id:
            students = students.filter(school_class_id=school_class_id)
        if section_id:
            students = students.filter(section_id=section_id)
    else:
        # Admins
        if school_class_id:
            students = students.filter(school_class_id=school_class_id)
        if section_id:
            students = students.filter(section_id=section_id)
        
    serializer = StudentSerializer(students, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student(request, id):
    # Role-based restriction
    if request.user.role == 'student':
        if not hasattr(request.user, 'student_profile') or request.user.student_profile.id != id:
            return Response(
                {"error": "Permission denied. You can only view your own student details."},
                status=status.HTTP_403_FORBIDDEN
            )
    elif request.user.role == 'teacher':
        if hasattr(request.user, 'teacher_profile'):
            teacher = request.user.teacher_profile
            try:
                student = Student.objects.get(id=id)
                if student.school_class not in teacher.classes.all() or student.section not in teacher.sections.all():
                    return Response(
                        {"error": "Permission denied. You can only view details of students in your assigned classes and sections."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Student.DoesNotExist:
                return Response(
                    {"error": "Student not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {"error": "Permission denied. Teacher profile not found."},
                status=status.HTTP_403_FORBIDDEN
            )

    try:
        student = Student.objects.get(id=id)
        serializer = StudentSerializer(student)
        return Response(serializer.data)
    except Student.DoesNotExist:
        return Response(
            {"error": "Student not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def update_student(request, id):
    try:
        student = Student.objects.get(id=id)
    except Student.DoesNotExist:
        return Response(
            {"error": "Student not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    data = request.data.copy()

    # If user fields are in request data, update the associated user as well
    if 'email' in data or 'username' in data or 'phone' in data:
        try:
            with transaction.atomic():
                user = student.user
                if 'email' in data:
                    user.email = data.get('email')
                if 'username' in data:
                    user.username = data.get('username')
                if 'phone' in data:
                    user.phone = data.get('phone')
                user.save()

                # set the user id in data
                data['user'] = user.id

                serializer = StudentSerializer(student, data=data)
                if serializer.is_valid():
                    serializer.save()
                    return Response({
                        "message": "Student updated successfully"
                    })
                else:
                    transaction.set_rollback(True)
                    return Response(
                        serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST
                    )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        serializer = StudentSerializer(student, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Student updated successfully"
            })
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def delete_student(request, id):
    try:
        student = Student.objects.get(id=id)
        user = student.user
        with transaction.atomic():
            student_details = f"Deleted student: {student.admission_number} ({user.email if user else 'No User'})"
            student.delete()
            if user:
                user.delete()
            log_action(
                user=request.user,
                action="DELETE_STUDENT",
                details=student_details,
                request=request
            )
        return Response({
            "message": "Student deleted successfully"
        })
    except Student.DoesNotExist:
        return Response(
            {"error": "Student not found"},
            status=status.HTTP_404_NOT_FOUND
        )


# CLASS CRUD VIEWS
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_classes(request):
    if request.method == 'GET':
        classes = SchoolClass.objects.all().order_by('name')
        serializer = SchoolClassSerializer(classes, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.role == 'admin':
            return Response({"error": "Admin permission required"}, status=status.HTTP_403_FORBIDDEN)
        serializer = SchoolClassSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def manage_class_detail(request, pk):
    try:
        school_class = SchoolClass.objects.get(pk=pk)
    except SchoolClass.DoesNotExist:
        return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = SchoolClassSerializer(school_class, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    elif request.method == 'DELETE':
        school_class.delete()
        return Response({"message": "Class deleted successfully"})


# SECTION CRUD VIEWS
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_sections(request):
    if request.method == 'GET':
        class_id = request.query_params.get('class_id')
        if class_id:
            sections = Section.objects.filter(school_class_id=class_id).order_by('name')
        else:
            sections = Section.objects.all().order_by('school_class__name', 'name')
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        if not request.user.role == 'admin':
            return Response({"error": "Admin permission required"}, status=status.HTTP_403_FORBIDDEN)
        serializer = SectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def manage_section_detail(request, pk):
    try:
        section = Section.objects.get(pk=pk)
    except Section.DoesNotExist:
        return Response({"error": "Section not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = SectionSerializer(section, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    elif request.method == 'DELETE':
        section.delete()
        return Response({"message": "Section deleted successfully"})


# SUBJECT CRUD VIEWS
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_subjects(request):
    if request.method == 'GET':
        subjects = Subject.objects.all().order_by('name')
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        if not request.user.role == 'admin':
            return Response({"error": "Admin permission required"}, status=status.HTTP_403_FORBIDDEN)
        serializer = SubjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def manage_subject_detail(request, pk):
    try:
        subject = Subject.objects.get(pk=pk)
    except Subject.DoesNotExist:
        return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        subject.delete()
        return Response({"message": "Subject deleted successfully"})


# TEACHER CRUD VIEWS
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_teachers(request):
    if request.method == 'GET':
        teachers = Teacher.objects.select_related('user').prefetch_related('subjects', 'classes', 'sections').all().order_by('user__username')
        serializer = TeacherSerializer(teachers, many=True)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        if not request.user.role == 'admin':
            return Response({"error": "Admin permission required"}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        email = data.get('email')
        username = data.get('username')
        phone = data.get('phone', '')
        password = data.get('password', 'teacher123')
        
        try:
            with transaction.atomic():
                if User.objects.filter(email=email).exists():
                    user = User.objects.get(email=email)
                else:
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        phone=phone,
                        role='teacher',
                        is_verified=True,
                        is_active=True
                    )
                    user.set_password(password)
                    user.save()
                
                data['user'] = user.id
                serializer = TeacherSerializer(data=data)
                if serializer.is_valid():
                    teacher = serializer.save()
                    log_action(
                        user=request.user,
                        action="CREATE_TEACHER",
                        details=f"Created teacher with username: {username}, email: {email} (Employee ID: {teacher.employee_id})",
                        request=request
                    )
                    return Response({
                        "message": "Teacher added successfully"
                    }, status=status.HTTP_201_CREATED)
                else:
                    transaction.set_rollback(True)
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def manage_teacher_detail(request, pk):
    try:
        teacher = Teacher.objects.get(pk=pk)
    except Teacher.DoesNotExist:
        return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TeacherSerializer(teacher)
        return Response(serializer.data)
        
    elif request.method == 'PUT':
        data = request.data.copy()
        try:
            with transaction.atomic():
                user = teacher.user
                if 'email' in data:
                    user.email = data.get('email')
                if 'username' in data:
                    user.username = data.get('username')
                if 'phone' in data:
                    user.phone = data.get('phone')
                user.save()
                
                data['user'] = user.id
                serializer = TeacherSerializer(teacher, data=data)
                if serializer.is_valid():
                    serializer.save()
                    return Response({"message": "Teacher details updated successfully"})
                else:
                    transaction.set_rollback(True)
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    elif request.method == 'DELETE':
        try:
            with transaction.atomic():
                user = teacher.user
                teacher_details = f"Deleted teacher: {teacher.employee_id} ({user.email if user else 'No User'})"
                teacher.delete()
                if user:
                    user.delete()
                log_action(
                    user=request.user,
                    action="DELETE_TEACHER",
                    details=teacher_details,
                    request=request
                )
                return Response({"message": "Teacher deleted successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)