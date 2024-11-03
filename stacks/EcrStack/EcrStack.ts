import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcrStack extends cdk.Stack {
  public readonly appRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.appRepository = this.setupAppRepository();
  }

  setupAppRepository() {
    const repository = new ecr.Repository(this, 'Repository', {
      repositoryName: 'nextjs-cdk-example-repository',
      /**
       *
       * Image Scan on Push is a feature in Amazon ECR (Elastic Container Registry)
       * that automatically scans container images for vulnerabilities as soon as
       * they are uploaded (pushed) to the repository.
       *
       */
      imageScanOnPush: false,
      /**
       *
       * Define should the repository be removed when the stack is deleted.
       *
       */
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      /**
       *
       * Expire images that are older than 30 days. Any expired images will be deleted from the repository
       *
       */
      lifecycleRules: [
        {
          maxImageAge: cdk.Duration.days(30)
        }
      ]
    });
    new cdk.CfnOutput(this, 'RepositoryUri', { value: repository.repositoryUri });
    return repository;
  }
}
