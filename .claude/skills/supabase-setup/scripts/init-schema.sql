-- 운전기사 가용 상태 대시보드 DB 스키마
-- Supabase SQL Editor에서 실행

-- ============================================================
-- 1. Enum 타입 정의
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'driver', 'viewer');
CREATE TYPE driver_status_enum AS ENUM ('available', 'unavailable', 'contact');


-- ============================================================
-- 2. profiles 테이블
-- auth.users 확장 — 사용자 프로필 및 역할 관리
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  initial       varchar(10) NOT NULL,                         -- 이니셜/표시명 (한글 성씨, 영문, 숫자 등 자유)
  role          user_role   NOT NULL DEFAULT 'driver',
  recent_vehicles text[]    NOT NULL DEFAULT '{}',            -- 최근 차량번호 최대 5개 (FIFO)
  sort_order    integer,                                       -- NULL이면 이름 알파벳순 정렬
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- auth.users 생성 시 profiles 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, initial, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'initial', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'driver')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 3. driver_status 테이블
-- 기사당 1개 레코드 (Upsert 패턴)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.driver_status (
  driver_id      uuid                PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status         driver_status_enum  NOT NULL DEFAULT 'contact',
  vehicle_number varchar(20),                                  -- nullable
  return_time    timestamptz,                                   -- UTC 저장, 불가용(unavailable) 시 필수
  updated_at     timestamptz         NOT NULL DEFAULT now(),
  updated_by     uuid                REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- driver_status 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.update_driver_status_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER driver_status_updated_at
  BEFORE UPDATE ON public.driver_status
  FOR EACH ROW EXECUTE FUNCTION public.update_driver_status_timestamp();

-- 신규 driver 계정 생성 시 driver_status 레코드 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_driver_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'driver' THEN
    INSERT INTO public.driver_status (driver_id, status)
    VALUES (NEW.id, 'contact')
    ON CONFLICT (driver_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_driver_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_driver_profile();

-- driver role로 변경될 때도 driver_status 생성
CREATE OR REPLACE TRIGGER on_driver_profile_role_updated
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'driver' AND OLD.role != 'driver')
  EXECUTE FUNCTION public.handle_new_driver_profile();


-- ============================================================
-- 4. RLS (Row Level Security) 활성화
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_status ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. RLS 정책 — profiles
-- ============================================================

-- 인증된 사용자 전체 조회 가능
CREATE POLICY "profiles: authenticated users can read all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- admin만 삽입 가능
CREATE POLICY "profiles: admin can insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- admin만 수정 가능
CREATE POLICY "profiles: admin can update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- admin만 삭제 가능
CREATE POLICY "profiles: admin can delete"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- 6. RLS 정책 — driver_status
-- ============================================================

-- 인증된 사용자 전체 조회 가능
CREATE POLICY "driver_status: authenticated users can read all"
  ON public.driver_status
  FOR SELECT
  TO authenticated
  USING (true);

-- driver는 본인 레코드만 수정 가능
CREATE POLICY "driver_status: driver can update own record"
  ON public.driver_status
  FOR UPDATE
  TO authenticated
  USING (
    driver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'driver'
    )
  );

-- admin은 모든 레코드 수정 가능
CREATE POLICY "driver_status: admin can update all"
  ON public.driver_status
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- admin만 삽입 가능 (트리거에서 service role로 삽입하므로 실제 삽입은 서버 사이드)
CREATE POLICY "driver_status: admin can insert"
  ON public.driver_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- 7. Realtime 활성화
-- Supabase 대시보드 > Database > Replication 에서도 활성화 필요
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_status;


-- ============================================================
-- 8. 인덱스
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_sort_order ON public.profiles(sort_order NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_driver_status_status ON public.driver_status(status);
CREATE INDEX IF NOT EXISTS idx_driver_status_updated_at ON public.driver_status(updated_at DESC);
