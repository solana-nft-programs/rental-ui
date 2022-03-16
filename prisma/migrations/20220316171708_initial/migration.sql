-- CreateTable
CREATE TABLE "claims" (
    "id" SERIAL NOT NULL,
    "uid" UUID NOT NULL,
    "token_manager_id" TEXT,
    "email" TEXT,
    "link" TEXT,
    "nft_mint_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claims_uid_key" ON "claims"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "claims_token_manager_id_email_nft_mint_id_key" ON "claims"("token_manager_id", "email", "nft_mint_id");
