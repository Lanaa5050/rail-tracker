-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── companies ───────────────────────────────────────────────────────────────
CREATE TABLE companies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── rails ───────────────────────────────────────────────────────────────────
CREATE TABLE rails (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  initiative_name  TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX rails_company_id_idx ON rails(company_id);

-- ─── rail_items ──────────────────────────────────────────────────────────────
CREATE TYPE rail_item_status AS ENUM ('New', 'In Work', 'Waiting', 'On Hold', 'Closed');

CREATE TABLE rail_items (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  rail_id     UUID              NOT NULL REFERENCES rails(id) ON DELETE CASCADE,
  priority    INTEGER           NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  action      TEXT              NOT NULL DEFAULT '',
  owner       TEXT              NOT NULL DEFAULT '',
  notes       TEXT              NOT NULL DEFAULT '',
  due_date    DATE,
  status      rail_item_status  NOT NULL DEFAULT 'New',
  last_update TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  sort_order  INTEGER,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX rail_items_rail_id_idx    ON rail_items(rail_id);
CREATE INDEX rail_items_status_idx     ON rail_items(status);
CREATE INDEX rail_items_due_date_idx   ON rail_items(due_date);
CREATE INDEX rail_items_priority_idx   ON rail_items(priority);
CREATE INDEX rail_items_owner_idx      ON rail_items(owner);

-- Auto-update last_update on any row edit
CREATE OR REPLACE FUNCTION set_last_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_update = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rail_items_last_update
  BEFORE UPDATE ON rail_items
  FOR EACH ROW EXECUTE FUNCTION set_last_update();

-- ─── custom_columns ──────────────────────────────────────────────────────────
CREATE TYPE custom_column_data_type AS ENUM (
  'text', 'date', 'dropdown', 'person', 'number', 'yes_no', 'link'
);

CREATE TABLE custom_columns (
  id               UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  label            TEXT                    NOT NULL,
  data_type        custom_column_data_type NOT NULL DEFAULT 'text',
  dropdown_options JSONB,
  display_order    INTEGER                 NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- ─── company_column_visibility ───────────────────────────────────────────────
CREATE TABLE company_column_visibility (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID    NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  custom_column_id UUID    NOT NULL REFERENCES custom_columns(id) ON DELETE CASCADE,
  hidden           BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (company_id, custom_column_id)
);

CREATE INDEX ccv_company_id_idx ON company_column_visibility(company_id);

-- ─── item_custom_values ──────────────────────────────────────────────────────
CREATE TABLE item_custom_values (
  id               UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  rail_item_id     UUID  NOT NULL REFERENCES rail_items(id) ON DELETE CASCADE,
  custom_column_id UUID  NOT NULL REFERENCES custom_columns(id) ON DELETE CASCADE,
  value            JSONB,
  UNIQUE (rail_item_id, custom_column_id)
);

CREATE INDEX icv_rail_item_id_idx     ON item_custom_values(rail_item_id);
CREATE INDEX icv_custom_column_id_idx ON item_custom_values(custom_column_id);

-- ─── notifications ───────────────────────────────────────────────────────────
CREATE TYPE notification_type AS ENUM (
  'due_soon_7',
  'due_soon_2',
  'overdue',
  'assigned',
  'status_changed'
);

CREATE TABLE notifications (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  rail_item_id UUID              NOT NULL REFERENCES rail_items(id) ON DELETE CASCADE,
  type         notification_type NOT NULL,
  owner        TEXT,
  read         BOOLEAN           NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_owner_idx      ON notifications(owner);
CREATE INDEX notifications_read_idx       ON notifications(read);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);

-- ─── invite_tokens ───────────────────────────────────────────────────────────
-- Shared invite links — anyone with the token can access the app
CREATE TABLE invite_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT        NOT NULL UNIQUE,
  label      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked    BOOLEAN     NOT NULL DEFAULT FALSE
);
