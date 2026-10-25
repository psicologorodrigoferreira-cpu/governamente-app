import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Botao, Cartao, Destaque, Legenda, Progresso, Subtitulo, Tela, Texto, Titulo } from '@/components/ui';
import { VideoYouTube } from '@/components/Video';
import {
  acontecendoAgora,
  Gravacao,
  lerConfiguracoes,
  listarEventos,
  listarGravacoes,
  listarTemasSemana,
  Ocorrencia,
  proximasOcorrencias,
  semanaDaTravessia,
  souTripulante,
} from '@/lib/ecossistema';
import { cores, espaco, fontes } from '@/lib/theme';

export default function Tripulante() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [temas, setTemas] = useState<Record<number, string>>({});
  const [proximo, setProximo] = useState<Ocorrencia | null>(null);
  const [tocando, setTocando] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const sou = await souTripulante();
          setOk(sou);
          if (!sou) return;
          const [c, g, t, ev] = await Promise.all([lerConfiguracoes(), listarGravacoes(), listarTemasSemana(), listarEventos()]);
          setConfig(c);
          setGravacoes(g);
          setTemas(t);
          setProximo(proximasOcorrencias(ev.filter((e) => e.publico === 'mesa'), 21)[0] ?? null);
        } catch {
          setOk(false);
        }
      })();
    }, []),
  );

  if (ok === null) {
    return (
      <Tela>
        <ActivityIndicator color={cores.petroleo} />
      </Tela>
    );
  }

  if (!ok) {
    return (
      <Tela>
        <Titulo>
          Área do <Destaque>Tripulante</Destaque>
        </Titulo>
        <Texto>
          Este espaço é exclusivo de quem participa da Mesa GovernaMente: link dos encontros ao vivo, gravações e a semana atual da
          Travessia.
        </Texto>
        <Texto style={{ color: cores.grafiteSuave }}>
          Já é Tripulante? Entre no app com o mesmo e-mail da sua inscrição na Mesa.
        </Texto>
        <Botao titulo="Conhecer a Mesa GovernaMente" onPress={() => Linking.openURL('https://mesa.governamente.com.br/')} />
      </Tela>
    );
  }

  const total = Number(config.travessia_semanas ?? 26) || 26;
  const sem = semanaDaTravessia(config.travessia_inicio ?? '2026-12-01', total);
  const agora = proximo ? acontecendoAgora(proximo) : false;

  return (
    <Tela>
      <Legenda>MESA GOVERNAMENTE · {(config.travessia_nome ?? 'Travessia').toUpperCase()}</Legenda>
      <Titulo>
        Bem-vindo à <Destaque>tripulação</Destaque>
      </Titulo>

      <Cartao escuro>
        {sem.semana === 0 ? (
          <>
            <Text style={s.semanaRotulo}>A TRAVESSIA COMEÇA EM</Text>
            <Text style={s.semanaNum}>{sem.faltamDias === 1 ? '1 dia' : `${sem.faltamDias} dias`}</Text>
          </>
        ) : sem.semana > total ? (
          <>
            <Text style={s.semanaRotulo}>TRAVESSIA CONCLUÍDA</Text>
            <Text style={s.semanaTema}>Obrigado por atravessar com a gente.</Text>
          </>
        ) : (
          <>
            <Text style={s.semanaRotulo}>SEMANA ATUAL</Text>
            <Text style={s.semanaNum}>
              {sem.semana} <Text style={s.semanaDe}>de {total}</Text>
            </Text>
            {!!temas[sem.semana] && <Text style={s.semanaTema}>{temas[sem.semana]}</Text>}
          </>
        )}
        {sem.semana > 0 && sem.semana <= total && <Progresso valor={sem.semana / total} />}
      </Cartao>

      <Subtitulo>Próximo encontro</Subtitulo>
      {proximo ? (
        <Cartao style={agora ? { borderColor: cores.ambar, borderWidth: 2 } : undefined}>
          <Text style={s.quando}>
            {agora
              ? 'Acontecendo agora'
              : proximo.quando.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) +
                ' · ' +
                proximo.quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={s.titulo}>{proximo.evento.titulo}</Text>
          {proximo.evento.link ? (
            <Botao titulo={agora ? 'Entrar no encontro' : 'Abrir link do encontro'} onPress={() => Linking.openURL(proximo.evento.link!)} />
          ) : (
            <Legenda>O link do encontro aparece aqui antes do horário.</Legenda>
          )}
        </Cartao>
      ) : (
        <Legenda>Nenhum encontro marcado nas próximas semanas.</Legenda>
      )}

      <Subtitulo>Gravações</Subtitulo>
      {gravacoes.length === 0 && <Legenda>As gravações dos encontros aparecem aqui.</Legenda>}
      {gravacoes.map((g) => (
        <Cartao key={g.id} onPress={tocando === g.id ? undefined : () => setTocando(g.id)} rotulo={`Assistir: ${g.titulo}`}>
          <Legenda>
            {g.semana ? `SEMANA ${g.semana}` : 'GRAVAÇÃO'}
            {g.data ? ` · ${new Date(`${g.data}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}
          </Legenda>
          <Text style={s.titulo}>{g.titulo}</Text>
          {!!g.descricao && <Texto style={{ color: cores.grafiteSuave }}>{g.descricao}</Texto>}
          {tocando === g.id ? <VideoYouTube id={g.youtube_id} /> : <Text style={s.assistir}>▶ Assistir</Text>}
        </Cartao>
      ))}

      <View style={{ marginTop: espaco.s }}>
        <Botao variante="secundario" titulo="Portal da Mesa" onPress={() => Linking.openURL('https://mesa.governamente.com.br/')} />
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  semanaRotulo: { fontFamily: fontes.textoForte, fontSize: 12, letterSpacing: 1, color: cores.salvia },
  semanaNum: { fontFamily: fontes.titulo, fontSize: 44, color: cores.areia },
  semanaDe: { fontFamily: fontes.texto, fontSize: 18, color: cores.salvia },
  semanaTema: { fontFamily: fontes.tituloItalico, fontSize: 19, color: cores.ambar, lineHeight: 26 },
  quando: { fontFamily: fontes.textoForte, fontSize: 13, color: cores.grafiteSuave, textTransform: 'capitalize' },
  titulo: { fontFamily: fontes.titulo, fontSize: 18, color: cores.petroleo },
  assistir: { fontFamily: fontes.textoForte, fontSize: 14, color: cores.ambarTerra },
});
