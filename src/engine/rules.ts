import yaml from 'js-yaml';
import { compileRule } from './dsl-compiler';
import type { RuleDef } from '../types/clinical';

import sepsisYaml from '../rules/sepsis.yaml?raw';
import chfYaml from '../rules/acute-chf.yaml?raw';
import pneumoniaYaml from '../rules/pneumonia.yaml?raw';
import atnYaml from '../rules/atn.yaml?raw';

export const defaultYamlSources: string[] = [sepsisYaml, chfYaml, pneumoniaYaml, atnYaml];

export const allRules: RuleDef[] = defaultYamlSources.map((r) => compileRule(yaml.load(r)));

export function compileRuleFromYaml(yamlString: string): RuleDef {
  return compileRule(yaml.load(yamlString));
}
