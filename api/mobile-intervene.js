import { createClient } from "@supabase/supabase-js";
import { createMobileInterventionHandler } from "../server/mobile-intervention.js";
export default createMobileInterventionHandler({ makeClient: createClient });
