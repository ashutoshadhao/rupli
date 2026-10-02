DROP INDEX "txn_source_ref_uniq";--> statement-breakpoint
CREATE UNIQUE INDEX "txn_source_ref_uniq" ON "transactions" USING btree ("user_id","source","source_ref","direction");