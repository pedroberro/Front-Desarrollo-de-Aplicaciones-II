// Where a signed-in user lands. For now the profile is the only finished screen.
export const HOME_PATH = '/perfil';

/** Router state other screens pass to /login to show a one-off notice. */
export interface LoginAviso {
  aviso: string;
}
