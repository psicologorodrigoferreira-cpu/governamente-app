import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Chip } from '@/components/ui';
import { lerPrefsGuia, PrefsGuia, salvarPrefsGuia } from '@/lib/guia';

/** Liga e desliga a voz guiada e os sons. Guarda a escolha no aparelho. */
export function useGuia() {
  const [prefs, setPrefs] = useState<PrefsGuia>({ voz: true, sons: true });
  useEffect(() => {
    lerPrefsGuia().then(setPrefs).catch(() => {});
  }, []);
  const mudar = (p: Partial<PrefsGuia>) => {
    const novo = { ...prefs, ...p };
    setPrefs(novo);
    salvarPrefsGuia(novo).catch(() => {});
  };
  return { prefs, mudar };
}

export function ControlesGuia({ prefs, mudar }: { prefs: PrefsGuia; mudar: (p: Partial<PrefsGuia>) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      <Chip rotulo="Voz guiada" ativo={prefs.voz} onPress={() => mudar({ voz: !prefs.voz })} />
      <Chip rotulo="Sons" ativo={prefs.sons} onPress={() => mudar({ sons: !prefs.sons })} />
    </View>
  );
}
