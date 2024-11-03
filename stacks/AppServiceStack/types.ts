import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';

export interface AppServiceStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  appSecurityGroup: ec2.SecurityGroup;
  appRepository: ecr.Repository;
  targetGroupArn: string;
}

/**
 *
 * function: setupCluster
 *
 */

export interface SetupClusterInput {
  vpc: ec2.Vpc;
}

export type SetupClusterOutput = ecs.Cluster;

/**
 *
 * function: setupTaskDefinition
 *
 */
export interface SetupTaskDefinitionInput {
  appRepository: ecr.Repository;
}

export type SetupTaskDefinitionOutput = ecs.TaskDefinition;

/**
 *
 * function: setupService
 *
 */
export interface SetupServiceInput {
  appSecurityGroup: ec2.SecurityGroup;
}

export type SetupServiceOutput = ecs.FargateService;

/**
 *
 * function: setupLoadBalancerMapping
 *
 */
export interface SetupLoadBalancerMappingInput {
  targetGroupArn: string;
}

export type SetupLoadBalancerMappingOutput = void;
