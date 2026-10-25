import Svg, { Circle, Path } from 'react-native-svg';

type P = { cor: string; size?: number };
const base = (cor: string) => ({ stroke: cor, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' });

export const IconeInicio = ({ cor, size = 24 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" {...base(cor)} />
  </Svg>
);
export const IconeTrilha = ({ cor, size = 24 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={8.5} {...base(cor)} />
    <Path d="M15.5 8.5l-2 5-5 2 2-5z" {...base(cor)} />
  </Svg>
);
export const IconeDiario = ({ cor, size = 24 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M6 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6z M6 3.5v17 M9.5 8h5 M9.5 11.5h5" {...base(cor)} />
  </Svg>
);
export const IconeConteudo = ({ cor, size = 24 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 6.5h16v11H4z M10 9.5l4.5 2.5-4.5 2.5z" {...base(cor)} />
  </Svg>
);
export const IconeConta = ({ cor, size = 24 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={8.5} r={3.8} {...base(cor)} />
    <Path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5" {...base(cor)} />
  </Svg>
);
