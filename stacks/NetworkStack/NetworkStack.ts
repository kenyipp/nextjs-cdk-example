import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly alb: elb.ApplicationLoadBalancer;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly targetGroup: elb.ApplicationTargetGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.vpc = this.setupVpc();
    this.albSecurityGroup = this.setupAlbSecurityGroup();
    this.appSecurityGroup = this.setupAppSecurityGroup();
    this.alb = this.setupAppLoadBalancer();
    this.targetGroup = this.setupTargetGroup();
  }

  private setupTargetGroup() {
    const targetGroup = new elb.ApplicationTargetGroup(this, 'TargetGroup', {
      protocol: elb.ApplicationProtocol.HTTP,
      vpc: this.vpc,
      port: 80,
      targetType: elb.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30)
      }
    });
    this.alb.addListener('Listener', {
      port: 80,
      open: true,
      defaultTargetGroups: [targetGroup]
    });
    return targetGroup;
  }

  private setupAppLoadBalancer() {
    const alb = new elb.ApplicationLoadBalancer(this, 'AppLoadBalancer', {
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: this.albSecurityGroup,
      deletionProtection: false,
      crossZoneEnabled: true, // This can not be `false` for Application Load Balancers.
      vpcSubnets: {
        /**
         *
         * Deploy the application load balancer in the public subnets
         * so that it can receive traffic from the internet.
         *
         */
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

    new cdk.CfnOutput(this, 'AppLoadBalancerDnsName', {
      value: alb.loadBalancerDnsName
    });

    return alb;
  }

  private setupAppSecurityGroup() {
    const securityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      description: 'Security group for the  App',
      vpc: this.vpc,
      allowAllOutbound: true
    });

    /**
     *
     * Allow only the ALB to communicate with the  App on port 3000.
     *
     */
    securityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow traffic from the ALB on port 3000'
    );
    return securityGroup;
  }

  private setupAlbSecurityGroup() {
    const securityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      description: 'Security group for the  App load balancer',
      vpc: this.vpc,
      allowAllOutbound: true
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    return securityGroup;
  }

  private setupVpc() {
    const vpc = new ec2.Vpc(this, 'Vpc', {
      /**
       *
       * The maximum number of Availability Zones for the VPC.
       *
       * If the number exceeds the available Availability Zones in that region,
       * it will be automatically reduced to match the number of available Availability Zones.
       *
       */
      maxAzs: 2,

      /**
       *
       * Create a NAT gateway for the private subnets in the VPC to enable instances
       * in those subnets to send outbound traffic to the internet.
       *
       */
      natGateways: 1,

      /**
       *
       * Create an internet gateway and attach it to the VPC to enable
       * instances in the VPC to communicate with the internet.
       *
       */
      createInternetGateway: true,

      subnetConfiguration: [
        {
          /**
           *
           * We should avoid specifying a large CIDR block for the VPC, as AWS has limits on the number of VPCs
           * and subnets that you can create in an AWS account.
           *
           * Modify this value only if you know what you are doing.
           *
           */
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        }
      ]
    });

    new cdk.CfnOutput(this, 'VpcId', { value: vpc.vpcId });
    new cdk.CfnOutput(this, 'VpcPublicSubnetIds', {
      value: vpc.publicSubnets.map((subnet) => subnet.subnetId).join(',')
    });
    new cdk.CfnOutput(this, 'VpcPrivateSubnetIds', {
      value: vpc.privateSubnets.map((subnet) => subnet.subnetId).join(',')
    });

    return vpc;
  }
}
