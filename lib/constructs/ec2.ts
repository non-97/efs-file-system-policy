import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface Ec2InstanceProps {
  vpc: cdk.aws_ec2.IVpc;
}

export class Ec2Instance extends Construct {
  readonly instance: cdk.aws_ec2.Instance;

  constructor(scope: Construct, id: string, props: Ec2InstanceProps) {
    super(scope, id);

    // IAM Role
    const role = new cdk.aws_iam.Role(this, "Role", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    // Key pair
    const keyName = "test-key-pair";
    const keyPair = new cdk.aws_ec2.CfnKeyPair(this, "Key Pair", {
      keyName,
    });
    keyPair.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // EC2 Instance
    this.instance = new cdk.aws_ec2.Instance(this, "Default", {
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023({
        cachedInContext: true,
      }),
      instanceType: new cdk.aws_ec2.InstanceType("t3.micro"),
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetGroupName: "Public",
      }),
      propagateTagsToVolumeOnCreation: true,
      ssmSessionPermissions: true,
      role,
      keyName,
    });

    // Output
    // Key pair
    new cdk.CfnOutput(this, "Get Secret Key Command", {
      value: `aws ssm get-parameter --name /ec2/keypair/${keyPair.getAtt(
        "KeyPairId"
      )} --region ${
        cdk.Stack.of(this).region
      } --with-decryption --query Parameter.Value --output text > ./key-pair/${keyName}.pem`,
    });

    // Instance Private IP address
    new cdk.CfnOutput(this, "Instance Private Ip Address", {
      value: this.instance.instancePrivateIp,
    });

    // Instance ID
    new cdk.CfnOutput(this, "Instance Id", {
      value: this.instance.instanceId,
    });
  }
}
