import chalk from 'chalk';

import { CommandLineInputs, CommandLineOptions, CommandMetadata, GenerateOptions, IonicEnvironment, ProjectType } from '../definitions';

import { FatalException, RunnerException, RunnerNotFoundException } from './errors';
import { Runner } from './runner';
import { prettyProjectName } from './project';

import * as angularGenerateLibType from './project/angular/generate';
import * as ionicAngularGenerateLibType from './project/ionic-angular/generate';

export abstract class GenerateRunner<T extends GenerateOptions> extends Runner<T, void> {
  constructor(protected env: IonicEnvironment) {
    super();
  }

  static async createFromProjectType(env: IonicEnvironment, type: 'angular'): Promise<angularGenerateLibType.GenerateRunner>;
  static async createFromProjectType(env: IonicEnvironment, type: 'ionic-angular'): Promise<ionicAngularGenerateLibType.GenerateRunner>;
  static async createFromProjectType(env: IonicEnvironment, type?: ProjectType): Promise<GenerateRunner<any>>;
  static async createFromProjectType(env: IonicEnvironment, type?: ProjectType): Promise<GenerateRunner<any>> {
    if (type === 'angular') {
      const { GenerateRunner } = await import('./project/angular/generate');
      return new GenerateRunner(env);
    } else if (type === 'ionic-angular') {
      const { GenerateRunner } = await import('./project/ionic-angular/generate');
      return new GenerateRunner(env);
    } else {
      throw new RunnerNotFoundException(
        `Generators are not supported in this project type (${chalk.bold(prettyProjectName(env.project.type))}).` +
        (type === 'custom' ? `Since you're using the ${chalk.bold('custom')} project type, this command won't work. The Ionic CLI doesn't know how to generate components for custom projects.\n\n` : '')
      );
    }
  }

  createOptionsFromCommandLine(inputs: CommandLineInputs, options: CommandLineOptions): GenerateOptions {
    const [ type, name ] = inputs;
    return { type, name };
  }

  async ensureCommandLine(inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> { /* overwritten in subclasses */ }
  abstract specializeCommandMetadata(metadata: CommandMetadata): Promise<CommandMetadata>;
}

export async function generate(env: IonicEnvironment, inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
  try {
    const runner = await GenerateRunner.createFromProjectType(env, env.project.type);
    const opts = runner.createOptionsFromCommandLine(inputs, options);
    await runner.run(opts);
  } catch (e) {
    if (e instanceof RunnerException) {
      throw new FatalException(e.message);
    }

    throw e;
  }
}
