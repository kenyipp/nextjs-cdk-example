# NextJs Cdk Example

This repository provides a comprehensive guide on deploying a Next.js application in Docker to Amazon Web Services. It leverages the power of the AWS Cloud Development Kit (CDK) to streamline the deployment process, allowing you to set up an auto-scaling ECS Fargate service alongside an Application Load Balancer in just a few minutes.

With this setup, your application can seamlessly handle varying traffic loads, ensuring high availability and performance. Whether you are a developer looking to scale your application or exploring cloud deployment options, this repository serves as a practical resource to get you started quickly and efficiently.

## Features

- **ECS Fargate Service**: Run your application without managing servers.
- **Load Balancing**: Automatically distribute incoming traffic to containers.
- **Auto-Scaling**: Scale your application based on CPU usage.
- **Customizable Task Definitions**: Easily modify CPU, memory, and environment variables.

## Prerequisites

Before using this stack, ensure you have the following:

- AWS account
- AWS CLI installed and configured
- Node.js and yarn installed
- AWS CDK installed globally:  
  ```bash
  npm install -g aws-cdk
  ```
- Basic knowledge of Next.js and Docker

## Getting Started
To deploy the application, we will begin by deploying the CDK stacks. After the deployment, we will obtain the ECR URI. Once the image is pushed to this ECR URI, the container will be created automatically. Finally, we can navigate to the load balancer URI provided in the output of the CDK deployment to verify the success of the deployment.

### Deploy the CDK Stacks

1. **Clone the Repository**  
Start by cloning the repository:
    ```bash
    git clone https://github.com/kenyipp/nextjs-cdk-example.git
    cd nextjs-cdk-example
    ```
2. **Install Dependencies**
   ```bash
    yarn
   ```
3. **Create the Environment Variables File**  
In the root directory of the project, create a .env file to store your AWS credentials and region settings. This file should contain the following variables, which are essential for the CDK to deploy resources to your AWS account:
   ```
   AWS_ACCOUNT_ID=<your-aws-account-id>
   AWS_REGION=<your-aws-region>
   ```
4. **Bootstrap the CDK**  
The CDK bootstrap command initializes the AWS environment for your project. It sets up the necessary resources that CDK needs to deploy stacks in your account. Run the following command to bootstrap your AWS environment:
   ```bash
   cdk bootstrap
   ```
5. **Deploy the CDK Stack**  
Deploy the entire stack by executing the command below. This command creates all the resources defined in your CDK application, including the ECS cluster, load balancer, and security groups.

   ```bash
   cdk deploy --all
   ```

Note: This command will deploy the complete CDK stack. At this point, you won’t be able to navigate to the load balancer URI since we haven’t yet pushed the image to the ECR for the task to run. 

### Push the image to ECR

1. **Deploy the CDK Stacks**  
After deploying the CDK stacks, you can find essential information, such as the ECR URI and the load balancer domain, in the output in the console, which you can also find in the AWS Management Console. Make sure to copy these details, as they are crucial for the next steps.

2. **Navigate to the Example Folder**  
Open your terminal and change your directory to the example folder where your Docker configuration is located:
    ```bash
    cd ./example
    ```

3. **Log in to Your ECR Repository**  
Use the following command to log in to your ECR repository. This command retrieves an authentication token and pipes it directly to the Docker client to authenticate your Docker session:
    ```bash
    aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.<your-region>.amazonaws.com
    ```

4. **Build Your Docker Image**  
Next, build your Docker image from the Dockerfile in the current directory. This command compiles your Next.js application into a Docker image:
    ```bash
    docker build -t <your-image-name>:<tag> .
    ```
    Replace `<your-image-name>` with your desired image name and `<tag>` with a version tag (e.g., latest).

5. **Tag Your Docker Image for ECR**  
Once your image is built, you need to tag it for your ECR repository. This step helps in organizing and managing different versions of your image:
    ```bash
    docker tag <your-image-name>:<tag> <your-account-id>.dkr.ecr.<your-region>.amazonaws.com/<your-repo-name>:<tag>
    ```
    Make sure to replace `<your-repo-name>` with the name of your ECR repository.

6. **Push the Image to ECR**  
After tagging, push the image to your ECR repository using the following command. This action uploads your Docker image to AWS, making it available for deployment:
    ```bash
    docker push <your-account-id>.dkr.ecr.<your-region>.amazonaws.com/<your-repo-name>:<tag>
    ```
    This step may take a few minutes, depending on the size of your Docker image and your internet connection.

After successfully pushing your image, you can navigate to the load balancer domain you copied earlier. If everything is set up correctly, you should be able to access your Next.js application through this domain.

Since I am using Cloudflare as my CDN, I can simply create a CNAME record that points to the load balancer domain. If you would like to integrate CloudFront, you can add the following code snippet to your network stack:

```typescript
private setupCloudFrontDistribution() {
  const distribution = new cloudfront.Distribution(this, 'MyDistribution', {
    defaultBehavior: {
      origin: new origins.LoadBalancerV2Origin(this.alb, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY, // Ensures all communication is secure
      }),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // Redirect HTTP to HTTPS
    },
  });
  return distribution;
}
```

## Next Step
Congratulations! Your Next.js application is now deployed to the Amazon cloud. However, it's important to note that simply pushing a new image to the ECR will not automatically update the running container. To enable automatic updates of the container when a new image is pushed, consider setting up a CI/CD pipeline. You can use tools like GitHub Actions or AWS CodePipeline to automate the process of updating the image tag in the task definition.

## Contributing
Contributions are welcome! If you have suggestions or improvements, please create an issue or submit a pull request.

## License
This project is licensed under the MIT License - see the [MIT](LICENSE) file for details.
