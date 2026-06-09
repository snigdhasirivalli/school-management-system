from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from .serializers import RegisterSerializer
from .models import User
from .utils import generate_otp


@api_view(['POST'])
def register_user(request):

    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():

        email = serializer.validated_data['email']

        if User.objects.filter(email=email).exists():

            return Response(
                {"error": "Email already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp = generate_otp()

        serializer.save(
            otp=otp,
            is_verified=False
        )

        return Response({
            "message": "User registered successfully",
            "otp": otp
        })

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['POST'])
def verify_otp(request):

    email = request.data.get('email')
    otp = request.data.get('otp')

    try:
        user = User.objects.get(email=email)

        if user.otp == otp:

            user.is_verified = True
            user.otp = None
            user.save()

            return Response({
                "message": "OTP verified successfully"
            })

        return Response(
            {"error": "Invalid OTP"},
            status=status.HTTP_400_BAD_REQUEST
        )

    except User.DoesNotExist:

        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
def set_password(request):

    email = request.data.get('email')
    password = request.data.get('password')

    try:
        user = User.objects.get(email=email)

        if not user.is_verified:

            return Response(
                {"error": "OTP not verified"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(password)
        user.save()

        return Response({
            "message": "Password set successfully"
        })

    except User.DoesNotExist:

        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):

    user = request.user
    data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
    }

    if user.role == 'student' and hasattr(user, 'student_profile'):
        student = user.student_profile
        data['student_id'] = student.id
        data['school_class'] = student.school_class_id
        data['section'] = student.section_id
        data['class_name'] = student.school_class.name if student.school_class else None
        data['section_name'] = student.section.name if student.section else None
        data['admission_number'] = student.admission_number
    elif user.role == 'teacher' and hasattr(user, 'teacher_profile'):
        teacher = user.teacher_profile
        data['teacher_id'] = teacher.id
        data['employee_id'] = teacher.employee_id

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_audit_logs(request):
    from .permissions import IsAdmin
    if not IsAdmin().has_permission(request, None):
        return Response({"error": "Admin permission required"}, status=status.HTTP_403_FORBIDDEN)

    from .models import AuditLog
    from .serializers import AuditLogSerializer
    logs = AuditLog.objects.select_related('actor').all().order_by('-timestamp')[:500]  # Cap at 500 for performance
    serializer = AuditLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    email = request.data.get('email')
    phone = request.data.get('phone')
    password = request.data.get('password')
    username = request.data.get('username')

    if email:
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return Response({"error": "Email already in use by another user"}, status=status.HTTP_400_BAD_REQUEST)
        user.email = email

    if phone:
        if User.objects.filter(phone=phone).exclude(id=user.id).exists():
            return Response({"error": "Phone number already in use by another user"}, status=status.HTTP_400_BAD_REQUEST)
        user.phone = phone

    if username:
        if User.objects.filter(username=username).exclude(id=user.id).exists():
            return Response({"error": "Username already in use"}, status=status.HTTP_400_BAD_REQUEST)
        user.username = username

    if password:
        user.set_password(password)

    user.save()

    from .utils import log_action
    log_action(
        user=user,
        action="UPDATE_PROFILE",
        details=f"Updated profile details. Username: {user.username}, Email: {user.email}",
        request=request
    )

    return Response({
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
    })


@api_view(['GET'])
def debug_endpoint(request):
    import time
    from student_management.models import Teacher
    
    results = {}
    
    # Test 1: Count of teachers
    try:
        t0 = time.time()
        count = Teacher.objects.count()
        results['count_teachers'] = {
            'value': count,
            'time': f"{time.time() - t0:.4f}s"
        }
    except Exception as e:
        results['count_teachers'] = {'error': str(e)}
        
    # Test 2: Fetch teachers simple values (without select/prefetch or ordering)
    try:
        t0 = time.time()
        simple_list = list(Teacher.objects.values('id', 'employee_id')[:5])
        results['simple_list'] = {
            'value': simple_list,
            'time': f"{time.time() - t0:.4f}s"
        }
    except Exception as e:
        results['simple_list'] = {'error': str(e)}
        
    # Test 3: Fetch teachers with select_related user (without prefetch or order)
    try:
        t0 = time.time()
        teachers_user = list(Teacher.objects.select_related('user').all()[:5])
        results['teachers_user'] = {
            'count': len(teachers_user),
            'time': f"{time.time() - t0:.4f}s"
        }
    except Exception as e:
        results['teachers_user'] = {'error': str(e)}

    # Test 4: Fetch teachers with prefetch_related (without user or order)
    try:
        t0 = time.time()
        teachers_prefetch = list(Teacher.objects.prefetch_related('subjects').all()[:5])
        results['teachers_prefetch'] = {
            'count': len(teachers_prefetch),
            'time': f"{time.time() - t0:.4f}s"
        }
    except Exception as e:
        results['teachers_prefetch'] = {'error': str(e)}
        
    # Test 5: Fetch teachers with user ordering only
    try:
        t0 = time.time()
        teachers_order = list(Teacher.objects.all().order_by('user__username')[:5])
        results['teachers_order'] = {
            'count': len(teachers_order),
            'time': f"{time.time() - t0:.4f}s"
        }
    except Exception as e:
        results['teachers_order'] = {'error': str(e)}

    return Response(results)
    