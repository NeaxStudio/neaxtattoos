import requests
import sys
import json
from datetime import datetime

class NeaxTattoosAPITester:
    def __init__(self, base_url="https://tattoo-studio-pro.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        if success:
            print(f"✅ {test_name} - PASSED")
            self.tests_passed += 1
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.tests_run += 1

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_result(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_result(name, True, f"Status: {response.status_code} (No JSON)")
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}: {error_data}")
                except:
                    self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_seed_data(self):
        """Test seeding initial data"""
        return self.run_test("Seed Data", "POST", "seed", 200)

    def test_get_artists(self):
        """Test getting artists list"""
        success, data = self.run_test("Get Artists", "GET", "artists", 200)
        if success and isinstance(data, list) and len(data) >= 3:
            self.log_result("Artists Count Validation", True, f"Found {len(data)} artists")
            return True, data
        elif success:
            self.log_result("Artists Count Validation", False, f"Expected at least 3 artists, got {len(data) if isinstance(data, list) else 0}")
        return success, data

    def test_get_services(self):
        """Test getting services list"""
        success, data = self.run_test("Get Services", "GET", "services", 200)
        if success and isinstance(data, list) and len(data) >= 4:
            self.log_result("Services Count Validation", True, f"Found {len(data)} services")
            return True, data
        elif success:
            self.log_result("Services Count Validation", False, f"Expected at least 4 services, got {len(data) if isinstance(data, list) else 0}")
        return success, data

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}",
            "phone": "+1234567890"
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, test_user_data)
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            self.log_result("Registration Token Validation", True, "Token and user data received")
            return True, response
        elif success:
            self.log_result("Registration Token Validation", False, "Missing token or user data in response")
        
        return success, response

    def test_user_login(self):
        """Test user login with existing credentials"""
        # First register a user
        timestamp = datetime.now().strftime('%H%M%S')
        register_data = {
            "email": f"login_test_{timestamp}@example.com",
            "password": "LoginTest123!",
            "name": f"Login Test {timestamp}"
        }
        
        # Register user
        reg_success, reg_response = self.run_test("Pre-Login Registration", "POST", "auth/register", 200, register_data)
        if not reg_success:
            return False, {}
        
        # Now test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        
        success, response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        
        if success and 'token' in response and 'user' in response:
            self.log_result("Login Token Validation", True, "Login successful with token")
            return True, response
        elif success:
            self.log_result("Login Token Validation", False, "Missing token or user data in login response")
        
        return success, response

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            self.log_result("Get Current User", False, "No authentication token available")
            return False, {}
        
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_create_booking(self):
        """Test creating a booking"""
        if not self.token:
            self.log_result("Create Booking", False, "No authentication token available")
            return False, {}
        
        # First get artists and services
        artists_success, artists = self.test_get_artists()
        services_success, services = self.test_get_services()
        
        if not artists_success or not services_success or not artists or not services:
            self.log_result("Create Booking", False, "Failed to get artists or services for booking")
            return False, {}
        
        booking_data = {
            "artist_id": artists[0]['artist_id'],
            "service_id": services[0]['service_id'],
            "appointment_date": "2024-12-31",
            "appointment_time": "2:00 PM",
            "notes": "Test booking from API test"
        }
        
        return self.run_test("Create Booking", "POST", "bookings", 200, booking_data)

    def test_get_my_bookings(self):
        """Test getting user's bookings"""
        if not self.token:
            self.log_result("Get My Bookings", False, "No authentication token available")
            return False, {}
        
        return self.run_test("Get My Bookings", "GET", "bookings/my", 200)

    def test_get_all_bookings(self):
        """Test getting all bookings (admin endpoint)"""
        return self.run_test("Get All Bookings", "GET", "bookings", 200)

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        return self.run_test("Invalid Login", "POST", "auth/login", 401, invalid_data)

    def test_duplicate_registration(self):
        """Test registering with existing email"""
        # Use the same email from registration test
        if hasattr(self, 'test_email'):
            duplicate_data = {
                "email": self.test_email,
                "password": "AnotherPass123!",
                "name": "Duplicate User"
            }
            return self.run_test("Duplicate Registration", "POST", "auth/register", 400, duplicate_data)
        else:
            self.log_result("Duplicate Registration", False, "No test email available for duplicate test")
            return False, {}

def main():
    print("🚀 Starting Neax Tattoos API Testing...")
    print("=" * 60)
    
    tester = NeaxTattoosAPITester()
    
    # Test sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_seed_data,
        tester.test_get_artists,
        tester.test_get_services,
        tester.test_user_registration,
        tester.test_get_current_user,
        tester.test_user_login,
        tester.test_create_booking,
        tester.test_get_my_bookings,
        tester.test_get_all_bookings,
        tester.test_invalid_login,
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ {test.__name__} - EXCEPTION: {str(e)}")
            tester.tests_run += 1
        print("-" * 40)
    
    # Print summary
    print("\n" + "=" * 60)
    print(f"📊 TEST SUMMARY")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "0%")
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'tests_run': tester.tests_run,
                'tests_passed': tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
            },
            'results': tester.test_results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())