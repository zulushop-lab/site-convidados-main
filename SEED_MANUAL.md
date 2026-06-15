# 🌱 Criar Dados de Teste Manualmente

O código gerado é: **`EDRQ7ZSH`**

## Passo 1: Abra o Firebase Console

1. Vá para [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto **`Gemini Project`** (gen-lang-client-0435917056)
3. Clique em **Build** → **Firestore Database**
4. Certifique-se de que está visualizando o banco nomeado: **`ai-studio-remixmatheusisad-2704bafb-b28b-4074-97fe-0650887857e8`**
   - (Se vir "(default)" no seletor, clique e troque)

## Passo 2: Crie a Coleção `codes`

1. Clique em **"+ Criar Coleção"** ou **"Start Collection"**
2. Nome da coleção: `codes`
3. Primeiro documento:
   - **ID do documento**: `EDRQ7ZSH`
   - Clique em **"Próximo"**
4. Adicione um campo:
   - **Nome do campo**: `familyId`
   - **Tipo**: String
   - **Valor**: `fam_casal`
5. Clique em **"Salvar"**

## Passo 3: Crie a Coleção `families`

1. Clique em **"+ Criar Coleção"**
2. Nome da coleção: `families`
3. Primeiro documento:
   - **ID do documento**: `fam_casal`
   - Clique em **"Próximo"**
4. Adicione 3 campos:
   - `id` (String): `fam_casal`
   - `name` (String): `Matheus & Isadora`
   - `code` (String): `EDRQ7ZSH`
5. Clique em **"Salvar"**

## Passo 4: Crie a Coleção `guests`

1. Clique em **"+ Criar Coleção"**
2. Nome da coleção: `guests`
3. Primeiro documento:
   - **ID do documento**: `g_matheus`
   - Clique em **"Próximo"**
4. Adicione 4 campos:
   - `id` (String): `g_matheus`
   - `familyId` (String): `fam_casal`
   - `name` (String): `Matheus`
   - `isMainGuest` (Boolean): `true`
5. Clique em **"Salvar"**

## Passo 5: Crie o segundo guest

1. Clique em **"+ Adicionar Documento"** dentro da coleção `guests`
2. **ID do documento**: `g_isadora`
3. Clique em **"Próximo"**
4. Adicione 4 campos:
   - `id` (String): `g_isadora`
   - `familyId` (String): `fam_casal`
   - `name` (String): `Isadora`
   - `isMainGuest` (Boolean): `true`
5. Clique em **"Salvar"**

## ✅ Pronto!

Depois de criar todos os 4 documentos, você pode testar o RSVP:

1. Inicie o servidor de dev: `npm run dev`
2. Abra no navegador: `http://localhost:3000/rsvp/EDRQ7ZSH`
3. Veja a tela "Bem-vindo, Matheus & Isadora" com opção de selecionar quem é
4. Deslize para confirmar presença
5. Verifique se `rsvps/fam_casal` foi criado no Firestore

**Confirme aqui quando terminar!**
