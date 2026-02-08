import { type Static, Type } from "@sinclair/typebox";

export const MermaidConfigSchema = Type.Object({
  useAscii: Type.Optional(Type.Boolean()),
  paddingX: Type.Optional(Type.Number()),
  paddingY: Type.Optional(Type.Number()),
  boxBorderPadding: Type.Optional(Type.Number()),
});

export const ImageConfigSchema = Type.Union([
  Type.Literal(""),
  Type.Literal("github"),
  Type.Literal("twitter"),
  Type.Object({ file: Type.String() }, { additionalProperties: false }),
  Type.String(),
]);

export const ConfigSchema = Type.Object({
  // paths
  src: Type.Optional(Type.String()),
  dest: Type.Optional(Type.String()),
  port: Type.Optional(Type.Number()),
  url: Type.Optional(Type.String()),
  // site
  title: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
  lang: Type.Optional(Type.String()),
  author: Type.Optional(Type.String()),
  // branding
  logo: Type.Optional(Type.String()),
  faviconText: Type.Optional(Type.String()),
  // social + previews
  github: Type.Optional(Type.String()),
  image: Type.Optional(ImageConfigSchema),
  og: Type.Optional(Type.Object({
    type: Type.Optional(Type.String()),
    locale: Type.Optional(Type.String()),
  }, { additionalProperties: false })),
  twitter: Type.Optional(Type.Object({
    card: Type.Optional(Type.String()),
    site: Type.Optional(Type.String()),
    profile: Type.Optional(Type.String()),
  }, { additionalProperties: false })),
  // seo
  robots: Type.Optional(Type.String()),
  // content
  mermaid: Type.Optional(MermaidConfigSchema),
  // navigation
  navBar: Type.Optional(Type.Array(Type.String())),
}, { additionalProperties: false });

export type MermaidConfig = {
  useAscii: boolean;
  paddingX: number;
  paddingY: number;
  boxBorderPadding: number;
};
export type ImageConfig = Static<typeof ImageConfigSchema>;
export type Config = {
  src: string;
  dest: string;
  port: number;
  url: string;
  title: string;
  description: string;
  lang: string;
  author: string;
  logo: string;
  faviconText: string;
  github: string;
  image: ImageConfig;
  og: { type: string; locale: string };
  twitter: { card: string; site: string; profile: string };
  robots: string;
  mermaid: MermaidConfig;
  navBar: string[];
};

export type PageMeta = {
  title?: string;
  description?: string;
  author?: string;
  tags?: string[];
  date?: string | Date;
  draft?: boolean;
  image?: string;
};

export type Page = {
  url: string;
  slug: string;
  meta: PageMeta;
  html: string;
  raw: string;
  srcPath: string;
};

export type ThemeVariant = {
  id: string;
};

export type ThemePair = {
  light: ThemeVariant;
  dark: ThemeVariant;
};
