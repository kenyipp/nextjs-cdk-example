import 'dotenv/config';

import { CdkGraph, FilterPreset } from '@aws/pdk/cdk-graph';
import {
  CdkGraphDiagramPlugin,
  DiagramFormat
} from '@aws/pdk/cdk-graph-plugin-diagram';
import { App } from 'aws-cdk-lib';

import { AppServiceStack, EcrStack, NetworkStack } from './stacks';
import { config } from './utils';

// Wrap cdk app with async IIFE function to enable async cdk-graph report
// eslint-disable-next-line no-void, func-names
void (async function () {
  const app = new App();

  const env = {
    region: config.aws.region,
    account: config.aws.accountId
  };

  const networkStack = new NetworkStack(app, 'NetworkStack', { env });

  const ecrStack = new EcrStack(app, 'EcrStack', { env });

  new AppServiceStack(app, 'AppServiceStack', {
    env,
    vpc: networkStack.vpc,
    appSecurityGroup: networkStack.appSecurityGroup,
    appRepository: ecrStack.appRepository,
    targetGroupArn: networkStack.targetGroup.targetGroupArn
  });

  // Generate a diagram for the whole architecture
  const group = new CdkGraph(app, {
    plugins: [
      new CdkGraphDiagramPlugin({
        diagrams: [
          {
            name: 'nextjs-cdk-example-diagram',
            title: 'NextJS CDK Diagram',
            format: DiagramFormat.PNG,
            theme: 'light',
            filterPlan: {
              preset: FilterPreset.COMPACT
            }
          }
        ]
      })
    ]
  });

  app.synth();

  await group.report();
})();
