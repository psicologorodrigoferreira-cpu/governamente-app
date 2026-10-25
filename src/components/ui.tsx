import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { cores, espaco, fontes, raio, tamanhos } from '@/lib/theme';

/** Símbolo "Mente serena": perfil, onda e ponto âmbar. */
export function Logo({ size = 40, fundo = 'claro' }: { size?: number; fundo?: 'claro' | 'escuro' }) {
  const perfil = fundo === 'escuro' ? cores.areia : cores.petroleo;
  const onda = fundo === 'escuro' ? cores.salvia : cores.salviaEscura;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Símbolo GovernaMente">
      <Path
        d="M22 58L22 50C14 46 10 38 10 29C10 16 20 7 32 7C44 7 52 15 52 26L56 34C56.6 35.2 56 36 54.8 36L52 36L52 41C52 44 50 46 47 46L42 46L42 58"
        stroke={perfil}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M18 28C21.5 23.5 25.5 23.5 29 28C32.5 32.5 36.5 32.5 40 28"
        stroke={onda}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={41} cy={17} r={3.4} fill={cores.ambar} />
    </Svg>
  );
}

/** Nome com "Mente" em itálico âmbar. */
export function Marca({ escuro = false, size = 22 }: { escuro?: boolean; size?: number }) {
  return (
    <Text style={{ fontFamily: fontes.titulo, fontSize: size, color: escuro ? cores.areia : cores.petroleo }}>
      Governa
      <Text style={{ fontFamily: fontes.tituloItalico, color: escuro ? cores.ambar : cores.ambarTerra }}>Mente</Text>
    </Text>
  );
}

export function Titulo({ style, ...p }: TextProps) {
  return <Text accessibilityRole="header" style={[s.titulo, style]} {...p} />;
}
export function Subtitulo({ style, ...p }: TextProps) {
  return <Text accessibilityRole="header" style={[s.subtitulo, style]} {...p} />;
}
export function Texto({ style, ...p }: TextProps) {
  return <Text style={[s.texto, style]} {...p} />;
}
export function Legenda({ style, ...p }: TextProps) {
  return <Text style={[s.legenda, style]} {...p} />;
}
export function Destaque({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontFamily: fontes.tituloItalico, color: cores.ambarTerra }}>{children}</Text>;
}

export function Botao({
  titulo,
  onPress,
  variante = 'principal',
  carregando,
  desativado,
  style,
  corTexto,
}: {
  corTexto?: string;
  titulo: string;
  onPress: () => void;
  variante?: 'principal' | 'secundario' | 'texto';
  carregando?: boolean;
  desativado?: boolean;
  style?: ViewStyle;
}) {
  const bloqueado = desativado || carregando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!bloqueado }}
      onPress={bloqueado ? undefined : onPress}
      style={({ pressed }) => [
        s.botao,
        variante === 'secundario' && s.botaoSec,
        variante === 'texto' && s.botaoTexto,
        bloqueado && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={variante === 'principal' ? cores.areia : cores.petroleo} />
      ) : (
        <Text
          style={[
            s.botaoRotulo,
            variante !== 'principal' && { color: cores.petroleo },
            variante === 'texto' && { textDecorationLine: 'underline' },
            !!corTexto && { color: corTexto },
          ]}
        >
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

export function Cartao({
  children,
  style,
  onPress,
  escuro,
  rotulo,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  escuro?: boolean;
  rotulo?: string;
}) {
  const conteudo = <View style={[s.cartao, escuro && s.cartaoEscuro, style]}>{children}</View>;
  if (!onPress) return conteudo;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={rotulo} onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      {conteudo}
    </Pressable>
  );
}

export function Campo({ rotulo, ...p }: TextInputProps & { rotulo: string }) {
  return (
    <View style={{ marginBottom: espaco.m }}>
      <Text style={s.rotuloCampo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.grafiteSuave}
        style={[s.campo, p.multiline && { minHeight: 96, textAlignVertical: 'top' }]}
        {...p}
      />
    </View>
  );
}

export function Chip({ rotulo, ativo, onPress, cor }: { rotulo: string; ativo?: boolean; onPress: () => void; cor?: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!ativo }}
      onPress={onPress}
      style={[s.chip, ativo && { backgroundColor: cor ?? cores.petroleo, borderColor: cor ?? cores.petroleo }]}
    >
      <Text style={[s.chipTexto, ativo && { color: cores.branco }]}>{rotulo}</Text>
    </Pressable>
  );
}

/** Link discreto e sempre presente para apoio em crise. */
export function LinkApoio() {
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push('/apoio')} style={s.apoio}>
      <Text style={s.apoioTexto}>Precisa de ajuda agora? Toque aqui.</Text>
    </Pressable>
  );
}

export function Tela({
  children,
  rolar = true,
  escuro,
  semApoio,
}: {
  children: React.ReactNode;
  rolar?: boolean;
  escuro?: boolean;
  semApoio?: boolean;
}) {
  const fundo = { backgroundColor: escuro ? cores.petroleo : cores.areia };
  const corpo = (
    <View style={{ padding: espaco.m, paddingBottom: espaco.xl, gap: espaco.m }}>
      {children}
      {!semApoio && <LinkApoio />}
    </View>
  );
  return (
    <SafeAreaView style={[{ flex: 1 }, fundo]} edges={['top', 'left', 'right']}>
      {rolar ? <ScrollView keyboardShouldPersistTaps="handled">{corpo}</ScrollView> : corpo}
    </SafeAreaView>
  );
}

export function Progresso({ valor }: { valor: number }) {
  return (
    <View style={s.barra} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(valor * 100) }}>
      <View style={[s.barraCheia, { width: `${Math.max(4, Math.min(100, valor * 100))}%` }]} />
    </View>
  );
}

const s = StyleSheet.create({
  titulo: { fontFamily: fontes.titulo, fontSize: tamanhos.titulo, color: cores.petroleo, lineHeight: 36 },
  subtitulo: { fontFamily: fontes.titulo, fontSize: tamanhos.subtitulo, color: cores.petroleo, lineHeight: 28 },
  texto: { fontFamily: fontes.texto, fontSize: tamanhos.texto, color: cores.grafite, lineHeight: 24 },
  legenda: { fontFamily: fontes.textoMedio, fontSize: tamanhos.legenda, color: cores.grafiteSuave, letterSpacing: 0.3 },
  botao: {
    backgroundColor: cores.petroleo,
    borderRadius: raio.pill,
    paddingVertical: 15,
    paddingHorizontal: espaco.l,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  botaoSec: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: cores.petroleo },
  botaoTexto: { backgroundColor: 'transparent', minHeight: 40, paddingVertical: 8 },
  botaoRotulo: { fontFamily: fontes.textoForte, fontSize: 16, color: cores.areia },
  cartao: {
    backgroundColor: cores.areiaClara,
    borderRadius: raio.m,
    padding: espaco.m,
    borderWidth: 1,
    borderColor: cores.linha,
    gap: espaco.s,
  },
  cartaoEscuro: { backgroundColor: cores.petroleo, borderColor: cores.petroleo },
  rotuloCampo: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.petroleo, marginBottom: 6 },
  campo: {
    backgroundColor: cores.branco,
    borderRadius: raio.s,
    borderWidth: 1,
    borderColor: cores.linha,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fontes.texto,
    fontSize: 16,
    color: cores.grafite,
  },
  chip: {
    borderWidth: 1,
    borderColor: cores.linha,
    backgroundColor: cores.branco,
    borderRadius: raio.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipTexto: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.grafite },
  apoio: { alignSelf: 'center', paddingVertical: 10, marginTop: espaco.s },
  apoioTexto: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.alerta, textDecorationLine: 'underline' },
  barra: { height: 8, borderRadius: 4, backgroundColor: cores.linha, overflow: 'hidden' },
  barraCheia: { height: 8, borderRadius: 4, backgroundColor: cores.ambar },
});
