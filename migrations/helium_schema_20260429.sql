--
-- PostgreSQL database dump
--

\restrict Vd2m21gitDqlTjNKHMppS1d1QslKwYiXXZH1axZUmmdQ9MfaFddAuGK2bgM6ZF3

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NOTIFY pgrst, 'reload schema';
      END;
      $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ambassador_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ambassador_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ambassador_name text NOT NULL,
    ambassador_code text NOT NULL,
    base_path text NOT NULL,
    utm_source text NOT NULL,
    utm_medium text DEFAULT 'ambassador'::text NOT NULL,
    utm_campaign text NOT NULL,
    utm_content text NOT NULL,
    utm_id text,
    full_url text NOT NULL,
    audience_type text NOT NULL,
    channel_type text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    link_name text,
    click_count integer DEFAULT 0,
    first_clicked_at timestamp with time zone,
    last_clicked_at timestamp with time zone,
    email text,
    region text,
    ambassador_id uuid,
    short_url text,
    public_slug text,
    is_legacy boolean DEFAULT false NOT NULL
);


--
-- Name: ambassador_payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ambassador_payouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ambassador_id uuid NOT NULL,
    payout_period_start timestamp with time zone NOT NULL,
    payout_period_end timestamp with time zone NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    payout_status text DEFAULT 'pending'::text NOT NULL,
    payout_method text,
    external_payout_id text,
    paid_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    confirmation_note text
);


--
-- Name: ambassadors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ambassadors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    first_name text,
    last_name text,
    display_name text NOT NULL,
    email text,
    phone text,
    region_type text,
    region_value text,
    referral_code text,
    stripe_connect_account_id text,
    payout_method_status text,
    commission_plan_id text,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text,
    commission_rate numeric(5,2),
    payout_method text,
    payout_details text,
    w9_status text DEFAULT 'not_submitted'::text,
    tax_notes text,
    state text,
    city text
);


--
-- Name: api_call_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_call_log (
    id bigint NOT NULL,
    api_key_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    endpoint text NOT NULL,
    http_status integer NOT NULL,
    response_ms integer,
    ip inet,
    user_agent text,
    call_cost integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: api_call_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_call_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_call_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_call_log_id_seq OWNED BY public.api_call_log.id;


--
-- Name: api_customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stripe_customer_id text,
    org_name text NOT NULL,
    contact_email text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    tier text DEFAULT 'single_state'::text NOT NULL,
    scope_states text[] DEFAULT '{}'::text[] NOT NULL,
    monthly_call_cap integer,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    key_prefix text NOT NULL,
    key_hash text NOT NULL,
    label text,
    status text DEFAULT 'active'::text NOT NULL,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone
);


--
-- Name: api_mirror_sync_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_mirror_sync_log (
    id bigint NOT NULL,
    run_started_at timestamp with time zone DEFAULT now() NOT NULL,
    run_finished_at timestamp with time zone,
    rows_inserted integer DEFAULT 0 NOT NULL,
    rows_updated integer DEFAULT 0 NOT NULL,
    rows_removed integer DEFAULT 0 NOT NULL,
    error text
);


--
-- Name: api_mirror_sync_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_mirror_sync_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_mirror_sync_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_mirror_sync_log_id_seq OWNED BY public.api_mirror_sync_log.id;


--
-- Name: api_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_resources (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    category_slug text NOT NULL,
    subcategory_slug text,
    state text NOT NULL,
    city text,
    address text,
    phone text,
    website text,
    hours_json jsonb,
    languages text[],
    accessibility_json jsonb,
    last_verified_at timestamp with time zone,
    source_attribution text DEFAULT 'Veteran Care Verified Directory'::text NOT NULL,
    is_honeytoken boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ambassador_code text NOT NULL,
    utm_id text,
    application_id uuid,
    revenue_amount numeric(10,2) DEFAULT 0,
    commission_percentage numeric(5,2) DEFAULT 10.00,
    commission_amount numeric(10,2) DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    ambassador_id uuid,
    payout_id uuid
);


--
-- Name: email_suppressions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_suppressions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    unsubscribed_all boolean DEFAULT false NOT NULL,
    suppressed_categories text[] DEFAULT '{}'::text[] NOT NULL,
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: founder_digest_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.founder_digest_log (
    id bigint NOT NULL,
    et_date date NOT NULL,
    slot text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    recipients text,
    resend_id text,
    status text DEFAULT 'sent'::text NOT NULL
);


--
-- Name: founder_digest_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.founder_digest_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: founder_digest_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.founder_digest_log_id_seq OWNED BY public.founder_digest_log.id;


--
-- Name: founder_digest_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.founder_digest_queue (
    id bigint NOT NULL,
    event_type text NOT NULL,
    summary text NOT NULL,
    severity text DEFAULT 'info'::text NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    consumed_at timestamp with time zone
);


--
-- Name: founder_digest_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.founder_digest_queue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: founder_digest_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.founder_digest_queue_id_seq OWNED BY public.founder_digest_queue.id;


--
-- Name: lead_billing_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_billing_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_id uuid NOT NULL,
    navigator_request_id uuid,
    lead_category text,
    price_cents integer NOT NULL,
    billing_period text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    dispute_reason text,
    dispute_filed_at timestamp with time zone,
    dispute_resolved_at timestamp with time zone,
    dispute_resolution text,
    stripe_invoice_item_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lead_billing_records_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'billed'::text, 'disputed'::text, 'waived'::text, 'credited'::text])))
);


--
-- Name: lead_category_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_category_pricing (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_slug text NOT NULL,
    category_name text NOT NULL,
    price_cents integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lead_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    lead_class text NOT NULL,
    action_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    session_id text,
    anonymous_id text,
    source_surface text NOT NULL,
    partner_id uuid,
    resource_id uuid,
    category_slug text,
    subcategory_slug text,
    utm_id text,
    ambassador_id uuid,
    referral_code text,
    state text,
    city text,
    ai_origin boolean DEFAULT false NOT NULL,
    ai_intent_category text,
    ai_intent_subcategory text,
    delivery_status text,
    acknowledgement_status text,
    billable boolean DEFAULT false NOT NULL,
    billing_type text,
    metadata jsonb
);


--
-- Name: monetization_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monetization_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    partner_id uuid,
    lead_id uuid,
    reason text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    mismatch_type text,
    severity text,
    resolution_action text,
    resolved_by text,
    resolved_at timestamp with time zone,
    exception_type text,
    failure_reason text,
    retry_attempted boolean DEFAULT false,
    resolution_status text DEFAULT 'open'::text,
    confidence_level text,
    escalation_reason text,
    escalation_action_taken text,
    reviewed_by text,
    reviewed_at timestamp with time zone
);


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text,
    path text NOT NULL,
    referrer text,
    is_mobile boolean DEFAULT false NOT NULL,
    user_agent text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    utm_id text,
    ambassador_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_state text,
    user_city text
);


--
-- Name: partner_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    contact_name text NOT NULL,
    email text NOT NULL,
    phone text,
    website text,
    city text,
    state text,
    category_id uuid,
    service_description text,
    pricing_interest text DEFAULT 'both'::text NOT NULL,
    status text DEFAULT 'prospect'::text NOT NULL,
    admin_notes text,
    converted_provider_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    stripe_price_id text,
    stripe_checkout_url text,
    plan_type text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    session_id text,
    utm_id text,
    ambassador_id uuid,
    subscription_status text,
    base_plan_type text,
    featured_active boolean DEFAULT false,
    near_me_boost_active boolean DEFAULT false,
    sponsored_top_active boolean DEFAULT false,
    sponsored_inline_active boolean DEFAULT false,
    current_period_end timestamp with time zone,
    billing_active boolean DEFAULT false,
    requested_addons text,
    grace_period_end timestamp with time zone,
    grace_warning_sent boolean DEFAULT false,
    subcategory_ids text,
    billing_model text DEFAULT 'subscription_only'::text,
    lead_price_cents integer,
    referral_code text,
    referred_by_partner_id uuid,
    password_hash text,
    welcome_email_sent boolean DEFAULT false,
    is_lead_enabled boolean DEFAULT false,
    CONSTRAINT partner_applications_plan_type_check CHECK ((plan_type = ANY (ARRAY['state'::text, 'national'::text])))
);


--
-- Name: TABLE partner_applications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.partner_applications IS 'Partner intake pipeline';


--
-- Name: partner_attribution; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_attribution (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid,
    ambassador text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    stripe_customer_id text,
    stripe_subscription_id text,
    plan_type text,
    revenue_amount numeric(10,2),
    event_type text DEFAULT 'checkout_completed'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    utm_id text,
    ambassador_id uuid
);


--
-- Name: partner_referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_partner_id uuid NOT NULL,
    referred_company_name text NOT NULL,
    referred_contact_name text NOT NULL,
    referred_email text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    referred_application_id uuid,
    credit_coupon_id text,
    credit_applied_at timestamp with time zone,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT partner_referrals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'signed_up'::text, 'first_cycle_complete'::text, 'credit_applied'::text, 'expired'::text, 'rejected'::text])))
);


--
-- Name: partner_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    partner_id uuid NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval) NOT NULL
);


--
-- Name: partner_subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partner_subcategories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referral_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    referral_id uuid NOT NULL,
    entry_month text NOT NULL,
    entry_count integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'referral'::text NOT NULL
);


--
-- Name: rotation_fairness_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rotation_fairness_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    routing_scope_key text NOT NULL,
    snapshot_at timestamp with time zone DEFAULT now(),
    total_rotated_leads integer DEFAULT 0 NOT NULL,
    partner_distribution_json jsonb,
    fairness_status text,
    advisory_flag text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: sweepstakes_months; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sweepstakes_months (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    month text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    notes text,
    sponsor_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    prize_title text,
    prize_description text,
    prize_value integer,
    prize_image_url text,
    rules_text text,
    CONSTRAINT sweepstakes_months_status_check CHECK ((status = ANY (ARRAY['active'::text, 'closed'::text, 'archived'::text])))
);


--
-- Name: sweepstakes_winners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sweepstakes_winners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    month text NOT NULL,
    user_id text NOT NULL,
    entry_id uuid,
    selected_by_admin_id text,
    selection_method text DEFAULT 'random'::text NOT NULL,
    prize_notes text,
    sponsor_notes text,
    notified boolean DEFAULT false NOT NULL,
    notified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    placement integer DEFAULT 1 NOT NULL,
    entry_count_at_draw integer,
    CONSTRAINT sweepstakes_winners_selection_method_check CHECK ((selection_method = ANY (ARRAY['random'::text, 'manual'::text])))
);


--
-- Name: trusted_service_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_service_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    icon text DEFAULT 'shield'::text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    program_area text DEFAULT 'trusted_services'::text,
    group_type text DEFAULT 'service'::text
);


--
-- Name: trusted_service_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_service_leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    provider_name text NOT NULL,
    category_id uuid,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    city text,
    state text,
    message text,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role text,
    status_updated_at timestamp with time zone,
    close_reason text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    session_id text,
    utm_id text,
    ambassador_id uuid
);


--
-- Name: trusted_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    short_description text,
    website_url text,
    phone text,
    email text,
    address text,
    city text,
    state text,
    zip text,
    logo_url text,
    verification_status text DEFAULT 'pending'::text NOT NULL,
    verification_label text,
    cta_text text DEFAULT 'Learn More'::text NOT NULL,
    cta_url text,
    is_featured boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    notes_internal text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_national boolean DEFAULT false,
    program_area text DEFAULT 'trusted_services'::text,
    group_type text DEFAULT 'service'::text,
    listing_type text DEFAULT 'lead'::text,
    discount_value text,
    discount_description text,
    latitude double precision,
    longitude double precision,
    geocoded_at timestamp with time zone,
    geo_source text,
    featured_rank integer,
    featured_active boolean DEFAULT false,
    near_me_boost_active boolean DEFAULT false,
    sponsored_top_active boolean DEFAULT false,
    sponsored_inline_active boolean DEFAULT false,
    offer_title text,
    offer_description text,
    banner_image_url text,
    offer_expiry date,
    subcategory_slugs text[] DEFAULT '{}'::text[] NOT NULL,
    is_nonprofit boolean DEFAULT false NOT NULL,
    cross_list_category_slugs text[] DEFAULT '{}'::text[] NOT NULL
);


--
-- Name: user_attribution_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_attribution_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text NOT NULL,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    landing_page text,
    referrer text,
    created_at timestamp with time zone DEFAULT now(),
    utm_id text,
    ambassador_id uuid,
    is_house_default boolean DEFAULT false
);


--
-- Name: user_referral_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_referral_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    referral_code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_user_id text NOT NULL,
    referred_user_id text,
    referral_code text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    qualified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address inet,
    user_agent text,
    suspicion_flags jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT user_referrals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'qualified'::text, 'invalid'::text])))
);


--
-- Name: veteran_owned_businesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.veteran_owned_businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_name text NOT NULL,
    owner_name text NOT NULL,
    email text NOT NULL,
    phone text,
    website text,
    address text,
    city text,
    state text,
    zip text,
    description text,
    category_id uuid,
    subcategory text,
    is_veteran_owned boolean DEFAULT true,
    is_nonprofit boolean DEFAULT false,
    logo_url text,
    status text DEFAULT 'pending'::text,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    show_in_trusted_services boolean DEFAULT false
);


--
-- Name: api_call_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_call_log ALTER COLUMN id SET DEFAULT nextval('public.api_call_log_id_seq'::regclass);


--
-- Name: api_mirror_sync_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_mirror_sync_log ALTER COLUMN id SET DEFAULT nextval('public.api_mirror_sync_log_id_seq'::regclass);


--
-- Name: founder_digest_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founder_digest_log ALTER COLUMN id SET DEFAULT nextval('public.founder_digest_log_id_seq'::regclass);


--
-- Name: founder_digest_queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founder_digest_queue ALTER COLUMN id SET DEFAULT nextval('public.founder_digest_queue_id_seq'::regclass);


--
-- Name: ambassador_links ambassador_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ambassador_links
    ADD CONSTRAINT ambassador_links_pkey PRIMARY KEY (id);


--
-- Name: ambassador_payouts ambassador_payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ambassador_payouts
    ADD CONSTRAINT ambassador_payouts_pkey PRIMARY KEY (id);


--
-- Name: ambassadors ambassadors_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ambassadors
    ADD CONSTRAINT ambassadors_code_key UNIQUE (code);


--
-- Name: ambassadors ambassadors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ambassadors
    ADD CONSTRAINT ambassadors_pkey PRIMARY KEY (id);


--
-- Name: api_call_log api_call_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_call_log
    ADD CONSTRAINT api_call_log_pkey PRIMARY KEY (id);


--
-- Name: api_customers api_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_customers
    ADD CONSTRAINT api_customers_pkey PRIMARY KEY (id);


--
-- Name: api_customers api_customers_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_customers
    ADD CONSTRAINT api_customers_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: api_keys api_keys_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: api_mirror_sync_log api_mirror_sync_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_mirror_sync_log
    ADD CONSTRAINT api_mirror_sync_log_pkey PRIMARY KEY (id);


--
-- Name: api_resources api_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_resources
    ADD CONSTRAINT api_resources_pkey PRIMARY KEY (id);


--
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- Name: email_suppressions email_suppressions_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_suppressions
    ADD CONSTRAINT email_suppressions_email_key UNIQUE (email);


--
-- Name: email_suppressions email_suppressions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_suppressions
    ADD CONSTRAINT email_suppressions_pkey PRIMARY KEY (id);


--
-- Name: founder_digest_log founder_digest_log_et_date_slot_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founder_digest_log
    ADD CONSTRAINT founder_digest_log_et_date_slot_key UNIQUE (et_date, slot);


--
-- Name: founder_digest_log founder_digest_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founder_digest_log
    ADD CONSTRAINT founder_digest_log_pkey PRIMARY KEY (id);


--
-- Name: founder_digest_queue founder_digest_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founder_digest_queue
    ADD CONSTRAINT founder_digest_queue_pkey PRIMARY KEY (id);


--
-- Name: lead_billing_records lead_billing_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_billing_records
    ADD CONSTRAINT lead_billing_records_pkey PRIMARY KEY (id);


--
-- Name: lead_category_pricing lead_category_pricing_category_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_category_pricing
    ADD CONSTRAINT lead_category_pricing_category_slug_key UNIQUE (category_slug);


--
-- Name: lead_category_pricing lead_category_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_category_pricing
    ADD CONSTRAINT lead_category_pricing_pkey PRIMARY KEY (id);


--
-- Name: lead_events lead_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_events
    ADD CONSTRAINT lead_events_pkey PRIMARY KEY (id);


--
-- Name: monetization_audit_log monetization_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monetization_audit_log
    ADD CONSTRAINT monetization_audit_log_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: partner_applications partner_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_pkey PRIMARY KEY (id);


--
-- Name: partner_attribution partner_attribution_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_attribution
    ADD CONSTRAINT partner_attribution_pkey PRIMARY KEY (id);


--
-- Name: partner_referrals partner_referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_referrals
    ADD CONSTRAINT partner_referrals_pkey PRIMARY KEY (id);


--
-- Name: partner_sessions partner_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_sessions
    ADD CONSTRAINT partner_sessions_pkey PRIMARY KEY (id);


--
-- Name: partner_sessions partner_sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_sessions
    ADD CONSTRAINT partner_sessions_token_key UNIQUE (token);


--
-- Name: partner_subcategories partner_subcategories_category_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_subcategories
    ADD CONSTRAINT partner_subcategories_category_id_slug_key UNIQUE (category_id, slug);


--
-- Name: partner_subcategories partner_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_subcategories
    ADD CONSTRAINT partner_subcategories_pkey PRIMARY KEY (id);


--
-- Name: referral_entries referral_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_entries
    ADD CONSTRAINT referral_entries_pkey PRIMARY KEY (id);


--
-- Name: rotation_fairness_history rotation_fairness_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rotation_fairness_history
    ADD CONSTRAINT rotation_fairness_history_pkey PRIMARY KEY (id);


--
-- Name: sweepstakes_months sweepstakes_months_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sweepstakes_months
    ADD CONSTRAINT sweepstakes_months_month_key UNIQUE (month);


--
-- Name: sweepstakes_months sweepstakes_months_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sweepstakes_months
    ADD CONSTRAINT sweepstakes_months_pkey PRIMARY KEY (id);


--
-- Name: sweepstakes_winners sweepstakes_winners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sweepstakes_winners
    ADD CONSTRAINT sweepstakes_winners_pkey PRIMARY KEY (id);


--
-- Name: trusted_service_categories trusted_service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_service_categories
    ADD CONSTRAINT trusted_service_categories_pkey PRIMARY KEY (id);


--
-- Name: trusted_service_categories trusted_service_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_service_categories
    ADD CONSTRAINT trusted_service_categories_slug_key UNIQUE (slug);


--
-- Name: trusted_service_leads trusted_service_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_service_leads
    ADD CONSTRAINT trusted_service_leads_pkey PRIMARY KEY (id);


--
-- Name: trusted_services trusted_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_services
    ADD CONSTRAINT trusted_services_pkey PRIMARY KEY (id);


--
-- Name: user_attribution_sessions user_attribution_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_attribution_sessions
    ADD CONSTRAINT user_attribution_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_referral_profiles user_referral_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_referral_profiles
    ADD CONSTRAINT user_referral_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_referral_profiles user_referral_profiles_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_referral_profiles
    ADD CONSTRAINT user_referral_profiles_referral_code_key UNIQUE (referral_code);


--
-- Name: user_referral_profiles user_referral_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_referral_profiles
    ADD CONSTRAINT user_referral_profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_referrals user_referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_referrals
    ADD CONSTRAINT user_referrals_pkey PRIMARY KEY (id);


--
-- Name: veteran_owned_businesses veteran_owned_businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.veteran_owned_businesses
    ADD CONSTRAINT veteran_owned_businesses_pkey PRIMARY KEY (id);


--
-- Name: idx_amb_links_ambassador_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_amb_links_ambassador_id ON public.ambassador_links USING btree (ambassador_id);


--
-- Name: idx_amb_links_audience; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_amb_links_audience ON public.ambassador_links USING btree (audience_type);


--
-- Name: idx_amb_links_channel; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_amb_links_channel ON public.ambassador_links USING btree (channel_type);


--
-- Name: idx_amb_links_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_amb_links_code ON public.ambassador_links USING btree (ambassador_code);


--
-- Name: idx_amb_links_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_amb_links_created_at ON public.ambassador_links USING btree (created_at);


--
-- Name: idx_amb_links_is_legacy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_amb_links_is_legacy ON public.ambassador_links USING btree (is_legacy);


--
-- Name: idx_amb_links_public_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_amb_links_public_slug ON public.ambassador_links USING btree (public_slug) WHERE (public_slug IS NOT NULL);


--
-- Name: idx_amb_links_utm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_amb_links_utm_id ON public.ambassador_links USING btree (utm_id);


--
-- Name: idx_ambassadors_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ambassadors_code ON public.ambassadors USING btree (code);


--
-- Name: idx_ambassadors_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ambassadors_state ON public.ambassadors USING btree (state);


--
-- Name: idx_ambassadors_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ambassadors_status ON public.ambassadors USING btree (status);


--
-- Name: idx_api_call_log_customer_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_call_log_customer_created ON public.api_call_log USING btree (customer_id, created_at DESC);


--
-- Name: idx_api_customers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_customers_status ON public.api_customers USING btree (status);


--
-- Name: idx_api_customers_stripe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_customers_stripe ON public.api_customers USING btree (stripe_customer_id);


--
-- Name: idx_api_keys_active_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_active_hash ON public.api_keys USING btree (key_hash) WHERE (status = 'active'::text);


--
-- Name: idx_api_keys_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_customer ON public.api_keys USING btree (customer_id);


--
-- Name: idx_api_resources_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_resources_state ON public.api_resources USING btree (state);


--
-- Name: idx_api_resources_state_cat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_resources_state_cat ON public.api_resources USING btree (state, category_slug);


--
-- Name: idx_api_resources_state_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_resources_state_city ON public.api_resources USING btree (state, city);


--
-- Name: idx_attr_sess_amb_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attr_sess_amb_id ON public.user_attribution_sessions USING btree (ambassador_id);


--
-- Name: idx_attr_sess_ambassador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attr_sess_ambassador ON public.user_attribution_sessions USING btree (utm_content);


--
-- Name: idx_attr_sess_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attr_sess_created_at ON public.user_attribution_sessions USING btree (created_at);


--
-- Name: idx_attr_sess_house_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attr_sess_house_default ON public.user_attribution_sessions USING btree (is_house_default);


--
-- Name: idx_attr_sess_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attr_sess_session ON public.user_attribution_sessions USING btree (session_id);


--
-- Name: idx_attr_sess_utm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attr_sess_utm_id ON public.user_attribution_sessions USING btree (utm_id);


--
-- Name: idx_commissions_amb_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_amb_id ON public.commissions USING btree (ambassador_id);


--
-- Name: idx_commissions_ambassador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_ambassador ON public.commissions USING btree (ambassador_code);


--
-- Name: idx_commissions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_created_at ON public.commissions USING btree (created_at);


--
-- Name: idx_commissions_payout_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_payout_id ON public.commissions USING btree (payout_id);


--
-- Name: idx_commissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_commissions_status ON public.commissions USING btree (status);


--
-- Name: idx_fairness_history_scope; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fairness_history_scope ON public.rotation_fairness_history USING btree (routing_scope_key);


--
-- Name: idx_fairness_history_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fairness_history_time ON public.rotation_fairness_history USING btree (snapshot_at DESC);


--
-- Name: idx_founder_digest_queue_unconsumed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_founder_digest_queue_unconsumed ON public.founder_digest_queue USING btree (occurred_at) WHERE (consumed_at IS NULL);


--
-- Name: idx_lead_billing_partner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_billing_partner ON public.lead_billing_records USING btree (partner_id);


--
-- Name: idx_lead_billing_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_billing_period ON public.lead_billing_records USING btree (billing_period);


--
-- Name: idx_lead_billing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_billing_status ON public.lead_billing_records USING btree (status);


--
-- Name: idx_lead_events_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_events_category ON public.lead_events USING btree (category_slug);


--
-- Name: idx_lead_events_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_events_class ON public.lead_events USING btree (lead_class);


--
-- Name: idx_lead_events_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_events_created ON public.lead_events USING btree (created_at);


--
-- Name: idx_lead_events_partner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_events_partner ON public.lead_events USING btree (partner_id);


--
-- Name: idx_lead_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lead_events_type ON public.lead_events USING btree (event_type);


--
-- Name: idx_mon_audit_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mon_audit_created ON public.monetization_audit_log USING btree (created_at);


--
-- Name: idx_mon_audit_mismatch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mon_audit_mismatch ON public.monetization_audit_log USING btree (mismatch_type);


--
-- Name: idx_mon_audit_partner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mon_audit_partner ON public.monetization_audit_log USING btree (partner_id);


--
-- Name: idx_mon_audit_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mon_audit_type ON public.monetization_audit_log USING btree (event_type);


--
-- Name: idx_pa_amb_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pa_amb_id ON public.partner_applications USING btree (ambassador_id);


--
-- Name: idx_page_views_ambassador_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_ambassador_code ON public.page_views USING btree (ambassador_code);


--
-- Name: idx_page_views_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_created_at ON public.page_views USING btree (created_at DESC);


--
-- Name: idx_page_views_path; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_path ON public.page_views USING btree (path);


--
-- Name: idx_page_views_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_session_id ON public.page_views USING btree (session_id);


--
-- Name: idx_page_views_user_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_user_state ON public.page_views USING btree (user_state);


--
-- Name: idx_page_views_utm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_views_utm_id ON public.page_views USING btree (utm_id);


--
-- Name: idx_partner_app_referral_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_partner_app_referral_code ON public.partner_applications USING btree (referral_code) WHERE (referral_code IS NOT NULL);


--
-- Name: idx_partner_applications_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_applications_category ON public.partner_applications USING btree (category_id);


--
-- Name: idx_partner_applications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_applications_created ON public.partner_applications USING btree (created_at DESC);


--
-- Name: idx_partner_applications_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_applications_state ON public.partner_applications USING btree (state);


--
-- Name: idx_partner_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_applications_status ON public.partner_applications USING btree (status);


--
-- Name: idx_partner_apps_stripe_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_apps_stripe_customer ON public.partner_applications USING btree (stripe_customer_id);


--
-- Name: idx_partner_apps_stripe_sub; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_apps_stripe_sub ON public.partner_applications USING btree (stripe_subscription_id);


--
-- Name: idx_partner_attr_amb_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_attr_amb_id ON public.partner_attribution USING btree (ambassador_id);


--
-- Name: idx_partner_attr_ambassador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_attr_ambassador ON public.partner_attribution USING btree (ambassador);


--
-- Name: idx_partner_referrals_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_referrals_email ON public.partner_referrals USING btree (referred_email);


--
-- Name: idx_partner_referrals_referrer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_referrals_referrer ON public.partner_referrals USING btree (referrer_partner_id);


--
-- Name: idx_partner_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partner_sessions_token ON public.partner_sessions USING btree (token);


--
-- Name: idx_payouts_amb_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_amb_id ON public.ambassador_payouts USING btree (ambassador_id);


--
-- Name: idx_payouts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_created_at ON public.ambassador_payouts USING btree (created_at);


--
-- Name: idx_payouts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payouts_status ON public.ambassador_payouts USING btree (payout_status);


--
-- Name: idx_referral_entries_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_entries_month ON public.referral_entries USING btree (entry_month);


--
-- Name: idx_referral_entries_referral_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_referral_entries_referral_unique ON public.referral_entries USING btree (referral_id);


--
-- Name: idx_referral_entries_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_entries_user ON public.referral_entries USING btree (user_id);


--
-- Name: idx_sweepstakes_months_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sweepstakes_months_status ON public.sweepstakes_months USING btree (status);


--
-- Name: idx_sweepstakes_winners_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sweepstakes_winners_month ON public.sweepstakes_winners USING btree (month);


--
-- Name: idx_sweepstakes_winners_month_placement; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_sweepstakes_winners_month_placement ON public.sweepstakes_winners USING btree (month, placement);


--
-- Name: idx_sweepstakes_winners_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sweepstakes_winners_user ON public.sweepstakes_winners USING btree (user_id);


--
-- Name: idx_trusted_service_leads_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_service_leads_created ON public.trusted_service_leads USING btree (created_at DESC);


--
-- Name: idx_trusted_service_leads_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_service_leads_provider ON public.trusted_service_leads USING btree (provider_id);


--
-- Name: idx_trusted_service_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_service_leads_status ON public.trusted_service_leads USING btree (status);


--
-- Name: idx_trusted_services_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_services_active ON public.trusted_services USING btree (is_active);


--
-- Name: idx_trusted_services_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_services_category ON public.trusted_services USING btree (category_id);


--
-- Name: idx_trusted_services_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trusted_services_state ON public.trusted_services USING btree (state);


--
-- Name: idx_tsl_amb_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tsl_amb_id ON public.trusted_service_leads USING btree (ambassador_id);


--
-- Name: idx_urp_referral_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_urp_referral_code ON public.user_referral_profiles USING btree (referral_code);


--
-- Name: idx_urp_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_urp_user_id ON public.user_referral_profiles USING btree (user_id);


--
-- Name: idx_user_referrals_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_referrals_code ON public.user_referrals USING btree (referral_code);


--
-- Name: idx_user_referrals_referred; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_referrals_referred ON public.user_referrals USING btree (referred_user_id);


--
-- Name: idx_user_referrals_referred_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_referrals_referred_unique ON public.user_referrals USING btree (referred_user_id) WHERE (referred_user_id IS NOT NULL);


--
-- Name: idx_user_referrals_referrer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_referrals_referrer ON public.user_referrals USING btree (referrer_user_id);


--
-- Name: idx_user_referrals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_referrals_status ON public.user_referrals USING btree (status);


--
-- Name: trusted_services_cross_list_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trusted_services_cross_list_gin ON public.trusted_services USING gin (cross_list_category_slugs);


--
-- Name: trusted_services_subcategory_slugs_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trusted_services_subcategory_slugs_gin ON public.trusted_services USING gin (subcategory_slugs);


--
-- Name: ambassador_links ambassador_links_ambassador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ambassador_links
    ADD CONSTRAINT ambassador_links_ambassador_id_fkey FOREIGN KEY (ambassador_id) REFERENCES public.ambassadors(id);


--
-- Name: ambassador_payouts ambassador_payouts_ambassador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ambassador_payouts
    ADD CONSTRAINT ambassador_payouts_ambassador_id_fkey FOREIGN KEY (ambassador_id) REFERENCES public.ambassadors(id);


--
-- Name: api_call_log api_call_log_api_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_call_log
    ADD CONSTRAINT api_call_log_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.api_keys(id) ON DELETE CASCADE;


--
-- Name: api_call_log api_call_log_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_call_log
    ADD CONSTRAINT api_call_log_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.api_customers(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.api_customers(id) ON DELETE CASCADE;


--
-- Name: commissions commissions_ambassador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_ambassador_id_fkey FOREIGN KEY (ambassador_id) REFERENCES public.ambassadors(id);


--
-- Name: partner_applications partner_applications_ambassador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_ambassador_id_fkey FOREIGN KEY (ambassador_id) REFERENCES public.ambassadors(id);


--
-- Name: partner_applications partner_applications_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.trusted_service_categories(id);


--
-- Name: partner_applications partner_applications_converted_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_applications
    ADD CONSTRAINT partner_applications_converted_provider_id_fkey FOREIGN KEY (converted_provider_id) REFERENCES public.trusted_services(id);


--
-- Name: partner_attribution partner_attribution_ambassador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_attribution
    ADD CONSTRAINT partner_attribution_ambassador_id_fkey FOREIGN KEY (ambassador_id) REFERENCES public.ambassadors(id);


--
-- Name: partner_attribution partner_attribution_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_attribution
    ADD CONSTRAINT partner_attribution_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.partner_applications(id);


--
-- Name: partner_subcategories partner_subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partner_subcategories
    ADD CONSTRAINT partner_subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.trusted_service_categories(id) ON DELETE CASCADE;


--
-- Name: referral_entries referral_entries_referral_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_entries
    ADD CONSTRAINT referral_entries_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES public.user_referrals(id) ON DELETE CASCADE;


--
-- Name: sweepstakes_winners sweepstakes_winners_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sweepstakes_winners
    ADD CONSTRAINT sweepstakes_winners_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.referral_entries(id) ON DELETE SET NULL;


--
-- Name: trusted_service_leads trusted_service_leads_ambassador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_service_leads
    ADD CONSTRAINT trusted_service_leads_ambassador_id_fkey FOREIGN KEY (ambassador_id) REFERENCES public.ambassadors(id);


--
-- Name: trusted_service_leads trusted_service_leads_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_service_leads
    ADD CONSTRAINT trusted_service_leads_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.trusted_services(id);


--
-- Name: trusted_services trusted_services_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_services
    ADD CONSTRAINT trusted_services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.trusted_service_categories(id);


--
-- Name: user_attribution_sessions user_attribution_sessions_ambassador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_attribution_sessions
    ADD CONSTRAINT user_attribution_sessions_ambassador_id_fkey FOREIGN KEY (ambassador_id) REFERENCES public.ambassadors(id);


--
-- Name: veteran_owned_businesses veteran_owned_businesses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.veteran_owned_businesses
    ADD CONSTRAINT veteran_owned_businesses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.trusted_service_categories(id);


--
-- Name: partner_applications Admin full access partner_applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin full access partner_applications" ON public.partner_applications USING (true) WITH CHECK (true);


--
-- Name: trusted_service_categories Public read trusted_service_categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read trusted_service_categories" ON public.trusted_service_categories FOR SELECT USING (true);


--
-- Name: trusted_services Public read trusted_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read trusted_services" ON public.trusted_services FOR SELECT USING (true);


--
-- Name: ambassador_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ambassador_links ENABLE ROW LEVEL SECURITY;

--
-- Name: ambassador_payouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ambassador_payouts ENABLE ROW LEVEL SECURITY;

--
-- Name: ambassadors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;

--
-- Name: api_call_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_call_log ENABLE ROW LEVEL SECURITY;

--
-- Name: api_customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_customers ENABLE ROW LEVEL SECURITY;

--
-- Name: api_keys; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

--
-- Name: api_mirror_sync_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_mirror_sync_log ENABLE ROW LEVEL SECURITY;

--
-- Name: api_resources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_resources ENABLE ROW LEVEL SECURITY;

--
-- Name: commissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

--
-- Name: email_suppressions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

--
-- Name: founder_digest_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.founder_digest_log ENABLE ROW LEVEL SECURITY;

--
-- Name: founder_digest_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.founder_digest_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_billing_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_billing_records ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_category_pricing; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_category_pricing ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

--
-- Name: monetization_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.monetization_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_attribution; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_attribution ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: partner_subcategories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.partner_subcategories ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: rotation_fairness_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.rotation_fairness_history ENABLE ROW LEVEL SECURITY;

--
-- Name: sweepstakes_months; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sweepstakes_months ENABLE ROW LEVEL SECURITY;

--
-- Name: sweepstakes_winners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sweepstakes_winners ENABLE ROW LEVEL SECURITY;

--
-- Name: trusted_service_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trusted_service_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: trusted_service_leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trusted_service_leads ENABLE ROW LEVEL SECURITY;

--
-- Name: trusted_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trusted_services ENABLE ROW LEVEL SECURITY;

--
-- Name: user_attribution_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_attribution_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_referral_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_referral_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: veteran_owned_businesses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.veteran_owned_businesses ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict Vd2m21gitDqlTjNKHMppS1d1QslKwYiXXZH1axZUmmdQ9MfaFddAuGK2bgM6ZF3

