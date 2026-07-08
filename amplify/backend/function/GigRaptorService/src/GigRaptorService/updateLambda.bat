@echo off
REM Set AWS region
aws configure set region us-east-1

REM Change to script directory
pushd %~dp0

echo Restoring NuGet packages...
dotnet restore

echo Publishing for linux-arm64 (managed, no ReadyToRun)...
dotnet publish GigRaptorService.csproj -c Release -r linux-arm64 --self-contained false -o ./publish /p:PublishReadyToRun=false

if not exist publish (
	echo Publish failed; exiting with error.
	popd
	exit /b 1
)

echo Creating deployment package...
powershell -NoProfile -Command "if(Test-Path './deployment-package.zip'){Remove-Item './deployment-package.zip' -Force}; Compress-Archive -Path './publish/*' -DestinationPath './deployment-package.zip' -Force"

if not exist deployment-package.zip (
	echo Failed to create deployment zip; exiting.
	popd
	exit /b 1
)

echo Updating Lambda function code (raptor-gig-service)...
aws lambda update-function-code --function-name raptor-gig-service --zip-file fileb://deployment-package.zip --region us-east-1

REM Optionally ensure architecture is set to arm64 (uncomment to enforce)
REM aws lambda update-function-configuration --function-name raptor-gig-service --architectures arm64 --region us-east-1

echo Deploy complete.
popd