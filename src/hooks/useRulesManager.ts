import { useState, useCallback, useMemo } from 'react';
import type { RuleDef } from '../types/clinical';
import { defaultYamlSources, compileRuleFromYaml } from '../engine/rules';

const STORAGE_KEY = 'clinical-dx-engine-rules';

export interface RuleEntry {
  id: string;
  name: string;
  yamlSource: string;
  compiled: RuleDef | null;
  error: string | null;
}

function tryCompile(yamlSource: string): { compiled: RuleDef | null; error: string | null; name: string } {
  try {
    const compiled = compileRuleFromYaml(yamlSource);
    return { compiled, error: null, name: compiled.name };
  } catch (e) {
    return { compiled: null, error: e instanceof Error ? e.message : String(e), name: 'Invalid Rule' };
  }
}

function makeEntry(yamlSource: string, id?: string): RuleEntry {
  const { compiled, error, name } = tryCompile(yamlSource);
  return {
    id: id ?? crypto.randomUUID(),
    name,
    yamlSource,
    compiled,
    error,
  };
}

function loadFromStorage(): RuleEntry[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { id: string; yamlSource: string }[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map((item) => makeEntry(item.yamlSource, item.id));
  } catch {
    return null;
  }
}

function saveToStorage(entries: RuleEntry[]) {
  const data = entries.map((e) => ({ id: e.id, yamlSource: e.yamlSource }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function buildDefaults(): RuleEntry[] {
  return defaultYamlSources.map((src) => makeEntry(src));
}

export function useRulesManager() {
  const [entries, setEntries] = useState<RuleEntry[]>(() => {
    return loadFromStorage() ?? buildDefaults();
  });

  const compiledRules = useMemo(() => {
    return entries
      .filter((e): e is RuleEntry & { compiled: RuleDef } => e.compiled !== null)
      .map((e) => e.compiled);
  }, [entries]);

  const updateRule = useCallback((id: string, yamlSource: string) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? makeEntry(yamlSource, id) : e));
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeRule = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const addRule = useCallback((yamlSource: string) => {
    setEntries((prev) => {
      const next = [...prev, makeEntry(yamlSource)];
      saveToStorage(next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = buildDefaults();
    saveToStorage(defaults);
    setEntries(defaults);
  }, []);

  return { entries, compiledRules, updateRule, removeRule, addRule, resetToDefaults };
}
