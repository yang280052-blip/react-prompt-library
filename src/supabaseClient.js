import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dbjwslmkvxkeqhmwelui.supabase.co'
const supabaseKey = 'sb_publishable_YqIGvE4AxBTN5VoJmp0neg_TVIko-Rn'

export const supabase = createClient(supabaseUrl, supabaseKey)
