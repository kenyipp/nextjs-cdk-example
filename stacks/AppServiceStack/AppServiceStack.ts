import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

import {
  AppServiceStackProps,
  SetupClusterInput,
  SetupClusterOutput,
  SetupLoadBalancerMappingInput,
  SetupLoadBalancerMappingOutput,
  SetupServiceInput,
  SetupServiceOutput,
  SetupTaskDefinitionInput,
  SetupTaskDefinitionOutput
} from './types';

export class AppServiceStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly taskDefinition: ecs.TaskDefinition;
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: AppServiceStackProps) {
    super(scope, id, props);
    const { vpc, appRepository, appSecurityGroup, targetGroupArn } = props;
    this.cluster = this.setupCluster({ vpc });
    this.taskDefinition = this.setupTaskDefinition({ appRepository });
    this.service = this.setupService({ appSecurityGroup });
    this.setupLoadBalancerMapping({ targetGroupArn });
  }

  private setupLoadBalancerMapping({
    targetGroupArn
  }: SetupLoadBalancerMappingInput): SetupLoadBalancerMappingOutput {
    const targetGroup = elb.ApplicationTargetGroup.fromTargetGroupAttributes(
      this,
      'ImportedTargetGroup',
      {
        targetGroupArn
      }
    );
    this.service.attachToApplicationTargetGroup(targetGroup);
  }

  private setupService({ appSecurityGroup }: SetupServiceInput): SetupServiceOutput {
    const service = new ecs.FargateService(this, 'AppService', {
      taskDefinition: this.taskDefinition,
      // We don't need the service to be publicly accessible.
      assignPublicIp: false,
      cluster: this.cluster,
      securityGroups: [appSecurityGroup],
      desiredCount: 1
    });

    const scaling = service.autoScaleTaskCount({ maxCapacity: 2 });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(5)
    });

    return service;
  }

  private setupTaskDefinition({
    appRepository
  }: SetupTaskDefinitionInput): SetupTaskDefinitionOutput {
    const taskDefinition = new ecs.TaskDefinition(this, 'TaskDefinition', {
      networkMode: ecs.NetworkMode.AWS_VPC,
      compatibility: ecs.Compatibility.FARGATE,
      cpu: '256',
      memoryMiB: '512',
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX
      }
    });

    taskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromEcrRepository(appRepository),
      memoryLimitMiB: 512,
      portMappings: [
        {
          containerPort: 3000
        }
      ]
    });

    return taskDefinition;
  }

  private setupCluster({ vpc }: SetupClusterInput): SetupClusterOutput {
    const cluster = new ecs.Cluster(this, 'AppCluster', {
      vpc,
      clusterName: 'AppCluster'
    });
    return cluster;
  }
}
