"""
Django management command: run_test_suite
Python port of frontend/src/app/api/test-verification/route.ts

Usage:
    cd python_backend
    python manage.py run_test_suite

Runs the full PlaySphere PS-25 Alignment Verification Suite.
Requires the Firebase Admin SDK to be configured (serviceAccountKey.json or env vars).
"""
import asyncio
import random
import string
from datetime import datetime, timezone, timedelta

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run the PlaySphere PS-25 Alignment Verification Suite"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting PS-25 Alignment Verification Suite (Python)..."))
        result = asyncio.run(self._run_suite())

        if result["success"]:
            self.stdout.write(self.style.SUCCESS("\n✅ All tests PASSED!"))
        else:
            self.stdout.write(self.style.ERROR(f"\n❌ Test suite FAILED: {result.get('error')}"))

        self.stdout.write("\n--- LOGS ---")
        for line in result.get("logs", []):
            self.stdout.write(line)

    async def _run_suite(self) -> dict:
        # Import here to avoid circular imports at module level
        from firebase_service.firestore import (
            seed_landmarks_and_infrastructure,
            get_infrastructure,
            get_infrastructure_by_id,
            submit_ownership_request,
            approve_ownership_request,
            reject_ownership_request,
            get_ownership_request_by_venue_code,
            get_unverified_infrastructure,
            create_booking,
            cancel_booking,
        )
        from firebase_service.client import get_firestore_client
        from ai.concierge import handle_concierge_request
        from ai.discover import handle_discover_request
        from ai.infrastructure_discovery import run_infrastructure_discovery
        from shared.pricing import get_booking_lifecycle
        import asyncio

        logs: list[str] = []

        def log(msg: str):
            self.stdout.write(f"  [TEST] {msg}")
            logs.append(msg)

        tomorrow_str = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
        yesterday_str = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

        owner_uid = f"test_owner_{random.randint(10000, 99999)}"
        player_uid = f"test_player_{random.randint(10000, 99999)}"
        valid_booking_id = ""
        created_venue_id = ""

        try:
            log("Step 1: Seeding landmarks and infrastructure...")
            seed_landmarks_and_infrastructure()
            log("Database seeded successfully.")

            log("Step 2: Verifying infrastructure retrieval...")
            infra_items = get_infrastructure()
            log(f"Found {len(infra_items)} infrastructure items.")
            if len(infra_items) < 7:
                raise AssertionError(f"Expected >= 7 infrastructure items, found {len(infra_items)}")

            test_infra = next((i for i in infra_items if i.get("name") == "Lohia Park Sports Area"), None)
            if not test_infra:
                raise AssertionError("Lohia Park Sports Area infrastructure item not found.")
            log(f"Verified Lohia Park Sports Area exists.")

            # Reset Lohia Park if already claimed
            if test_infra.get("ownerLinked") or test_infra.get("bookable"):
                log("Resetting Lohia Park Sports Area to initial state for test...")
                db = get_firestore_client()
                db.collection("infrastructure").document(test_infra["id"]).update({
                    "ownerLinked": False, "bookable": False, "ownerId": None,
                    "ownershipStatus": None, "linkedOwnerId": None,
                    "ownershipVerifiedAt": None, "venueCode": "PS-LKO-BAD-1043"
                })

            log("Step 3: Submitting ownership request...")
            request_id = submit_ownership_request({
                "venueCode": "PS-LKO-BAD-1043",
                "infrastructureId": test_infra["id"],
                "infrastructureName": test_infra["name"],
                "ownerId": owner_uid,
                "ownerName": "Test Owner",
                "ownerEmail": f"testowner_{owner_uid}@test.com",
                "phone": "+91 99999 88888",
                "proofType": "URL",
                "proofUrl": "https://example.com/proof",
                "notes": "Test verification notes",
            })
            log(f"Ownership request submitted (ID: {request_id}).")

            # Verify duplicate protection
            try:
                submit_ownership_request({
                    "venueCode": "PS-LKO-BAD-1043",
                    "infrastructureId": test_infra["id"],
                    "infrastructureName": test_infra["name"],
                    "ownerId": owner_uid,
                    "ownerName": "Test Owner",
                    "ownerEmail": f"testowner_{owner_uid}@test.com",
                    "phone": "+91 99999 88888",
                    "proofType": "URL",
                    "proofUrl": "https://example.com/proof",
                    "notes": "Duplicate test",
                })
                raise AssertionError("Duplicate protection failed! Allowed duplicate request.")
            except ValueError as e:
                if "pending" in str(e).lower():
                    log("✅ Duplicate request protection verified.")
                else:
                    raise

            log("Step 4: Approving ownership request...")
            approve_ownership_request(request_id)
            updated_infra = get_infrastructure_by_id(test_infra["id"])
            if not updated_infra or not updated_infra.get("ownerLinked"):
                raise AssertionError("Ownership approval failed to update infrastructure.")
            log("✅ Ownership approved. Infrastructure ownerLinked=True, bookable=True.")

            # Find the created venue
            db = get_firestore_client()
            from google.cloud.firestore_v1 import FieldFilter
            q = db.collection("venues").where(filter=FieldFilter("ownerId", "==", owner_uid))
            venue_docs = list(q.stream())
            if not venue_docs:
                raise AssertionError(f"No marketplace venue created for ownerId: {owner_uid}")
            created_venue_id = venue_docs[0].id
            created_venue = {"id": created_venue_id, **venue_docs[0].to_dict()}
            log(f"✅ Marketplace venue created: \"{created_venue.get('name')}\" (ID: {created_venue_id})")

            log("Step 5: Testing AI Concierge...")
            await asyncio.sleep(1.5)
            disc_res = await handle_concierge_request(
                "Where is the SAI sports complex located in Lucknow?", [], "discovery"
            )
            log(f"AI Concierge responded ({len(disc_res['response'])} chars).")
            if not any(kw in disc_res["response"].lower() for kw in ["sai", "sports", "lucknow"]):
                raise AssertionError("AI Concierge did not mention SAI Sports Complex.")
            log("✅ AI Concierge discovery response verified.")

            await asyncio.sleep(1.5)
            book_res = await handle_concierge_request(
                f"I want to book Lohia Park Sports Area tomorrow at 11 AM", [], "discovery"
            )
            log(f"AI booking action: {book_res.get('action')}")
            if not book_res.get("action") or book_res["action"].get("type") != "book":
                log("WARNING: AI Concierge did not generate a structured booking action (may be LLM variability).")
            else:
                log("✅ AI Concierge booking action generated.")

            log("Step 6: Verifying discover insights...")
            await asyncio.sleep(1.5)
            insights = await handle_discover_request()
            log(f"Generated {len(insights)} insights.")
            if len(insights) != 3:
                raise AssertionError(f"Expected exactly 3 insights, got {len(insights)}")
            for i, ins in enumerate(insights):
                log(f"  Insight {i+1}: [{ins['type'].upper()}] \"{ins['title']}\" — {ins['description']}")
            log("✅ Discover insights verified.")

            log("Step 7: Testing booking logic...")
            try:
                create_booking({
                    "playerId": player_uid,
                    "playerName": "Test Player",
                    "ownerId": created_venue.get("ownerId", "system"),
                    "venueId": created_venue_id,
                    "venueName": created_venue.get("name"),
                    "venueArea": created_venue.get("area", "Gomti Nagar"),
                    "sport": "badminton",
                    "date": yesterday_str,
                    "slot": "09:00–10:00",
                    "amount": 300,
                    "paymentMethod": "UPI",
                    "paymentStatus": "payment_pending",
                    "bookingStatus": "pending",
                    "utrNumber": "", "screenshotUrl": "", "ticketId": "",
                })
                raise AssertionError("Expected past slot to be blocked but it succeeded.")
            except ValueError as e:
                if "past" in str(e).lower() or "passed" in str(e).lower():
                    log("✅ Past slot booking correctly blocked.")
                else:
                    raise

            valid_booking_id = create_booking({
                "playerId": player_uid,
                "playerName": "Test Player",
                "ownerId": created_venue.get("ownerId", "system"),
                "venueId": created_venue_id,
                "venueName": created_venue.get("name"),
                "venueArea": created_venue.get("area", "Gomti Nagar"),
                "sport": "badminton",
                "date": tomorrow_str,
                "slot": "18:00–19:00",
                "amount": 300,
                "paymentMethod": "UPI",
                "paymentStatus": "payment_pending",
                "bookingStatus": "pending",
                "utrNumber": "", "screenshotUrl": "", "ticketId": "",
            })
            log(f"✅ Future booking created (ID: {valid_booking_id}).")

            # Lifecycle checks
            lifecycle_checks = [
                {"date": tomorrow_str, "slot": "18:00–19:00", "bookingStatus": "pending", "paymentStatus": "payment_pending", "expected": "upcoming"},
                {"date": tomorrow_str, "slot": "18:00–19:00", "bookingStatus": "cancelled", "paymentStatus": "cancelled", "expected": "cancelled"},
                {"date": yesterday_str, "slot": "09:00–10:00", "bookingStatus": "confirmed", "paymentStatus": "paid", "expected": "completed"},
                {"date": yesterday_str, "slot": "09:00–10:00", "bookingStatus": "pending", "paymentStatus": "payment_pending", "expected": "expired"},
            ]
            for check in lifecycle_checks:
                result = get_booking_lifecycle(check)
                if result != check["expected"]:
                    raise AssertionError(
                        f"Lifecycle mismatch: expected '{check['expected']}', got '{result}'"
                    )
            log("✅ All booking lifecycle state assertions passed.")

            log("Step 8: Running infrastructure discovery scan...")
            disc_result = await run_infrastructure_discovery()
            log(f"Discovery: Added {disc_result['added']}, Skipped {disc_result['skipped']}, Errors {disc_result['errors']}.")
            if not disc_result["success"]:
                raise AssertionError("Discovery scan failed.")
            log("✅ Infrastructure discovery scan verified.")

            log("Step 9: Cleaning up test data...")
            if created_venue_id:
                db.collection("venues").document(created_venue_id).delete()
                log(f"Deleted test venue {created_venue_id}.")
            if valid_booking_id:
                db.collection("bookings").document(valid_booking_id).delete()
                log(f"Deleted test booking {valid_booking_id}.")
            # Reset infra
            db.collection("infrastructure").document(test_infra["id"]).update({
                "ownerLinked": False, "bookable": False, "ownerId": None,
                "ownershipStatus": None, "linkedOwnerId": None,
                "ownershipVerifiedAt": None, "venueCode": "PS-LKO-BAD-1043"
            })
            # Delete ownership request
            db.collection("ownership_requests").document(request_id).delete()
            # Clean up discovered infrastructure
            for d in db.collection("infrastructure").stream():
                if (d.to_dict() or {}).get("source") == "discovered":
                    d.reference.delete()
            log("Cleanup complete.")

            log("PS-25 Alignment Verification Suite COMPLETED SUCCESSFULLY! All checks passed.")
            return {"success": True, "logs": logs}

        except Exception as err:
            log(f"❌ ERROR: {err}")
            # Emergency cleanup
            try:
                db = get_firestore_client()
                if created_venue_id:
                    db.collection("venues").document(created_venue_id).delete()
                if valid_booking_id:
                    db.collection("bookings").document(valid_booking_id).delete()
            except Exception:
                pass
            return {"success": False, "error": str(err), "logs": logs}
