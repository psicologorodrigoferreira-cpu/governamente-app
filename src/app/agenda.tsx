import { useCallback, useState } from 'react';
import { Linking, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Botao, Cartao, Destaque, Legenda, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import {
  acontecendoAgora,
  definirLembreteEvento,
  Evento,
  lerLembretesAgenda,
  listarEventos,
  proximasOcorrencias,
} from '@/lib/ecossistema';
import { cores, espaco, fontes } from '@/lib/theme';

const COR: Record<Evento['tipo'], string> = {
  live: cores.ambarTerra,
  generosidade: cores.salviaEscura,
  mesa: cores.petroleo,
  outro: cores.grafiteSuave,
};
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const quandoTexto = (d: Date) => {
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);
  const dia =
    d.toDateString() === hoje.toDateString()
      ? 'Hoje'
      : d.toDateString() === amanha.toDateString()
        ? 'Amanhã'
        : d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
  const diaFmt = dia.charAt(0).toUpperCase() + dia.slice(1).replace(/\.$/, '');
  return `${diaFmt} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

export default function Agenda() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [lembretes, setLembretes] = useState<string[]>([]);
  const [aviso, setAviso] = useState('');

  useFocusEffect(
    useCallback(() => {
      listarEventos().then(setEventos).catch(() => {});
      lerLembretesAgenda().then(setLembretes);
    }, []),
  );

  async function alternar(e: Evento, ligar: boolean) {
    setAviso('');
    const ok = await definirLembreteEvento(e, ligar);
    if (!ok) setAviso(Platform.OS === 'web' ? 'Os lembretes funcionam no app instalado no celular.' : 'Ative as notificações do GovernaMente nos ajustes do celular.');
    setLembretes(await lerLembretesAgenda());
  }

  const proximas = proximasOcorrencias(eventos, 14).slice(0, 12);
  const ativos = eventos.filter((e) => e.ativo);

  return (
    <Tela>
      <Titulo>
        Agenda <Destaque>ao vivo</Destaque>
      </Titulo>
      <Texto>Lives, o Grupo da Generosidade e os encontros da Mesa. Ative o lembrete e receba um aviso 15 minutos antes.</Texto>

      <Subtitulo>Próximos dias</Subtitulo>
      {proximas.length === 0 && <Legenda>Nenhum encontro marcado nos próximos 14 dias.</Legenda>}
      {proximas.map((o) => {
        const agora = acontecendoAgora(o);
        return (
          <Cartao key={`${o.evento.id}-${o.quando.toISOString()}`} style={agora ? { borderColor: cores.ambar, borderWidth: 2 } : undefined}>
            <View style={s.linha}>
              <View style={[s.marca, { backgroundColor: COR[o.evento.tipo] }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[s.quando, agora && { color: cores.ambarTerra }]}>{agora ? 'Acontecendo agora' : quandoTexto(o.quando)}</Text>
                <Text style={s.titulo}>{o.evento.titulo}</Text>
                {o.evento.publico === 'mesa' && <Legenda>Só para Tripulantes</Legenda>}
              </View>
            </View>
            {!!o.evento.link && (
              <Botao
                variante={agora ? 'principal' : 'secundario'}
                titulo={agora ? 'Entrar agora' : 'Abrir link'}
                onPress={() => Linking.openURL(o.evento.link!)}
              />
            )}
          </Cartao>
        );
      })}

      <Subtitulo>Lembretes</Subtitulo>
      {ativos.map((e) => (
        <View key={e.id} style={s.lembrete}>
          <View style={{ flex: 1 }}>
            <Text style={s.lembreteTitulo}>{e.titulo}</Text>
            <Legenda>
              {e.dias_semana.map((d) => DIAS[d - 1]).join(', ')} · {e.hora.slice(0, 5)}
            </Legenda>
          </View>
          <Switch
            accessibilityLabel={`Lembrete: ${e.titulo}`}
            value={lembretes.includes(e.id)}
            onValueChange={(v) => alternar(e, v)}
            trackColor={{ true: cores.petroleo, false: cores.linha }}
            thumbColor={cores.branco}
          />
        </View>
      ))}
      {!!aviso && <Text style={s.aviso}>{aviso}</Text>}

      <Botao variante="texto" titulo="Sou Tripulante: abrir a Área do Tripulante" onPress={() => router.push('/tripulante')} />
    </Tela>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: 'row', gap: espaco.m, alignItems: 'center' },
  marca: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
  quando: { fontFamily: fontes.textoForte, fontSize: 13, color: cores.grafiteSuave },
  titulo: { fontFamily: fontes.titulo, fontSize: 18, color: cores.petroleo },
  lembrete: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: cores.linha },
  lembreteTitulo: { fontFamily: fontes.textoForte, fontSize: 15, color: cores.petroleo },
  aviso: { fontFamily: fontes.textoMedio, color: cores.alerta, fontSize: 14 },
});
