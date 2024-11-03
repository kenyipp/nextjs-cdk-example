export interface Config {
  nodeEnv: 'develop' | 'prod';
  aws: {
    region: string;
    accountId: string;
  };
}
