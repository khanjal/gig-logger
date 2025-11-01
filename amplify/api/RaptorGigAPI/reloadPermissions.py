"""
AWS Lambda Permission Reloader

This script reloads API Gateway permissions for Lambda functions across different environments.

Usage:
    python reloadPermissions.py

The script will prompt for your AWS Account ID, or you can set it as an environment variable:
    export AWS_ACCOUNT_ID=your-account-id-here
    export API_GATEWAY_ID=your-api-gateway-id  # Optional, defaults to 1al1hr5ub4

Requirements:
    - AWS CLI installed and configured
    - Appropriate IAM permissions to manage Lambda permissions
"""

import subprocess
import json
import uuid

def generate_random_guid():
    """Generate a random GUID (UUID version 4)."""
    return str(uuid.uuid4())

def get_lambda_policy(function_name, aws_account_id, api_gateway_id):
    print(f"Lambda Function: {function_name}")
    try:
        # Run the AWS CLI command to get the Lambda function's policy
        result = subprocess.run(
            ['aws', 'lambda', 'get-policy', '--function-name', function_name],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Output from the command
        output = result.stdout
        
        # Parse the JSON output
        data = json.loads(output)
        
        # Policy document is a JSON string, so parse it to extract SIDs
        policy_document = data.get('Policy', '{}')
        policy_data = json.loads(policy_document)
        
        # Loop through the statements and print each Sid
        statements = policy_data.get('Statement', [])
        for statement in statements:
            remove_lambda_permission(statement, function_name)

        # Add all the lambda permissions back in
        add_lambda_permissions(function_name, aws_account_id, api_gateway_id)
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
        # Status code 254 typically means no policy exists yet
        if e.returncode == 254:
            print("No existing policy found. Adding new permissions...")
            add_lambda_permissions(function_name, aws_account_id, api_gateway_id)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")

def remove_lambda_permission(statement, function_name):
    try:
        sid = statement.get('Sid')
        service = statement.get('Principal').get('Service')
        if sid and service == "apigateway.amazonaws.com":
            print(f"Service: {service} | Sid: {sid}")
            delete_command = f"aws lambda remove-permission --function-name {function_name} --statement-id {sid}"
            # Execute delete statement
            try:
            # Execute the command
                result = subprocess.run(
                    delete_command, 
                    shell=True, 
                    capture_output=True, 
                    text=True,
                    check=True
                )
                
                # Print the result of the command
                print(f"Removed {sid}")
            
            except subprocess.CalledProcessError as e:
                print(f"Error executing command: {e}")
                print("Command output:", e.output)
                print("Command error (if any):", e.stderr)
        else:
            print(f"Service {service} not apigateway.amazonaws.com or SID not present in statement")
    except:
        print("Statement failed")

def add_lambda_permissions(function_name, aws_account_id, api_gateway_id):
    try:
        lambda_commands = [
            f"aws lambda add-permission --function-name {{function-name}} --source-arn arn:aws:execute-api:us-east-1:{aws_account_id}:{api_gateway_id}/*/*/* --principal apigateway.amazonaws.com --statement-id {{statement-id}} --action lambda:InvokeFunction",
        ]
        
        for command in lambda_commands:
            # Generate a new GUID for this command
            guid = generate_random_guid()
            
            # Replace the statement-id with the generated GUID
            updated_command = command.replace("{statement-id}", guid).replace("{function-name}", function_name)
            #print(updated_command)
            try:
            # Execute the command
                result = subprocess.run(
                    updated_command, 
                    shell=True, 
                    capture_output=True, 
                    text=True,
                    check=True
                )
                
                # Print the result of the command
                print(f"Ran {updated_command}")
            
            except subprocess.CalledProcessError as e:
                print(f"Error executing command: {e}")
                print("Command output:", e.output)
                print("Command error (if any):", e.stderr)

    except:
        print("Add failed")

def display_menu():
    """Display the menu options."""
    print("Replace which lambda environment permissions:")
    print("1. DEV")
    print("2. TEST")
    print("3. PROD")
    print("4. Exit")


def main():
    # Get AWS account ID and API Gateway ID from user or environment variables
    import os
    
    aws_account_id = os.getenv('AWS_ACCOUNT_ID') or input("Enter your AWS Account ID: ")
    api_gateway_id = os.getenv('API_GATEWAY_ID', '1al1hr5ub4')  # Default to existing ID or prompt
    
    function_name_template = f'arn:aws:lambda:us-east-1:{aws_account_id}:function:raptor-gig-service:{{env}}'
    
    while True:
        display_menu()
        
        # Get user input
        choice = input("Enter your choice (1-4): ")
        
        # Handle the menu choice
        if choice == '1':
            get_lambda_policy(function_name_template.replace("{env}", 'dev'), aws_account_id, api_gateway_id)
        elif choice == '2':
            get_lambda_policy(function_name_template.replace("{env}", 'test'), aws_account_id, api_gateway_id)
        elif choice == '3':
            get_lambda_policy(function_name_template.replace("{env}", 'prod'), aws_account_id, api_gateway_id)
        elif choice == '4':
            print("Exiting the program.")
            break
        else:
            print("Invalid choice. Please enter a number between 1 and 4.")


if __name__ == '__main__':
    main()
