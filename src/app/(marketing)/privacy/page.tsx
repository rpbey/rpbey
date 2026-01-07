import type { Metadata } from 'next'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description: 'Politique de confidentialité et conditions d\'utilisation de la RPB.',
}

export default function PrivacyPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Politique de Confidentialité
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Dernière mise à jour : 7 Janvier 2026
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            1. Introduction
          </Typography>
          <Typography paragraph>
            La République Populaire du Beyblade ("RPB", "nous") s'engage à protéger votre vie privée. 
            Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles lorsque vous utilisez notre site web et nos services.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            2. Données collectées
          </Typography>
          <Typography paragraph>
            Nous collectons les informations suivantes lorsque vous vous connectez à notre service :
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Informations de compte Discord" 
                secondary="Identifiant utilisateur, nom d'utilisateur, avatar et adresse email." 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Informations Google (si lié)" 
                secondary="Si vous choisissez de lier votre compte Google, nous collectons votre adresse email et votre nom pour l'authentification." 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Données d'activité" 
                secondary="Statistiques de tournois, decks de Beyblade créés, et historique des matchs." 
              />
            </ListItem>
          </List>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            3. Utilisation des données Google
          </Typography>
          <Typography paragraph>
            Notre application utilise les services Google OAuth pour permettre aux administrateurs d'exporter les données de tournoi vers Google Sheets.
          </Typography>
          <Typography paragraph>
            L'utilisation et le transfert vers toute autre application des informations reçues des API Google respecteront la 
            <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}> Politique relative aux données utilisateur des services API Google</a>, 
            y compris les exigences d'utilisation limitée.
          </Typography>
          <Typography paragraph fontWeight="medium">
            Si vous connectez votre compte Google pour utiliser la fonctionnalité d'exportation vers Sheets :
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Accès" 
                secondary="Nous demandons l'accès uniquement pour créer et modifier des feuilles de calcul spécifiques aux tournois RPB." 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Stockage" 
                secondary="Nous stockons de manière sécurisée vos jetons d'accès et de rafraîchissement pour maintenir la connexion." 
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Partage" 
                secondary="Nous ne partageons vos données Google avec aucun tiers, sauf si requis par la loi." 
              />
            </ListItem>
          </List>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            4. Partage des données
          </Typography>
          <Typography paragraph>
            Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers. 
            Nous pouvons partager des données agrégées et anonymes à des fins statistiques.
          </Typography>
        </Box>

        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            5. Vos droits
          </Typography>
          <Typography paragraph>
            Conformément au RGPD et aux lois applicables, vous avez le droit de :
          </Typography>
          <List dense>
            <ListItem><ListItemText primary="Accéder à vos données personnelles." /></ListItem>
            <ListItem><ListItemText primary="Demander la correction de vos données." /></ListItem>
            <ListItem><ListItemText primary="Demander la suppression de votre compte et de toutes les données associées." /></ListItem>
            <ListItem><ListItemText primary="Révoquer les accès tiers (Discord, Google) à tout moment." /></ListItem>
          </List>
        </Box>

        <Box component="section">
          <Typography variant="h5" gutterBottom fontWeight="bold">
            6. Contact
          </Typography>
          <Typography paragraph>
            Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, veuillez nous contacter :
          </Typography>
          <Typography paragraph>
            Email : contact@rpbey.fr<br />
            Discord : Via le serveur officiel RPB
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
