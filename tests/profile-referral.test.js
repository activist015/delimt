import test from "node:test";
import assert from "node:assert/strict";
import { applyPendingReferral, captureReferral, pendingReferral } from "../src/profileReferral.js";

function memory(value="invite-code") {
  const values=new Map(value ? [["delimt_ref",value]] : []);
  return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
}
function fixture({owner="owner",referredBy=null,error=null,updateError=null,onUpdate}={}) {
  const calls=[];
  const client={auth:{async getUser(){return {data:{user:owner?{id:owner}:null},error}}},from(table){
    calls.push(["from",table]);
    let update=false;
    const query={select(columns){calls.push(["select",columns]);return this},eq(column,value){calls.push(["eq",column,value]);return this},
      update(patch){update=true;calls.push(["update",patch]);return this},
      async maybeSingle(){if(update){onUpdate?.();return {data:{id:"owner",referred_by:"invite-code"},error:updateError}}
        return {data:{id:"owner",referred_by:referredBy},error:null}}};
    return query;
  }};
  return {client,calls};
}
test("captures valid invitations and ignores untrusted URL values",()=>{
  const storage=memory(null);
  captureReferral(storage,"?ref=safe-code");
  assert.equal(pendingReferral(storage),"safe-code");
  captureReferral(storage,"?ref=unsafe%0Aprivate");
  assert.equal(pendingReferral(storage),"safe-code");
  storage.setItem("delimt_ref","bad&parameter=secret");
  assert.equal(pendingReferral(storage),null);
});
test("retains a referral while email confirmation has no authenticated session",async()=>{
  const storage=memory();const {client,calls}=fixture({owner:null});
  assert.equal(await applyPendingReferral(client,"owner",storage),"retry");
  assert.equal(storage.getItem("delimt_ref"),"invite-code");assert.deepEqual(calls,[]);
});
test("refuses a mismatched account before accessing profiles",async()=>{
  const {client,calls}=fixture({owner:"different-owner"});
  assert.equal(await applyPendingReferral(client,"owner",memory()),"retry");
  assert.deepEqual(calls,[]);
});
test("writes only a self-owned claim and never reads or increments the inviter's counter",async()=>{
  const {client,calls}=fixture();const storage=memory();
  assert.equal(await applyPendingReferral(client,"owner",storage),"applied");
  assert.equal(storage.getItem("delimt_ref"),null);
  assert.deepEqual(calls.filter(x=>x[0]==="update"),[["update",{referred_by:"invite-code"}]]);
  assert.ok(calls.filter(x=>x[0]==="eq").every(x=>x[1]==="id"&&x[2]==="owner"));
  assert.ok(!JSON.stringify(calls).includes("referral_count"));
});
test("a claim already counted during signup is not written again",async()=>{
  const {client,calls}=fixture({referredBy:"invite-code"});const storage=memory();
  assert.equal(await applyPendingReferral(client,"owner",storage),"already");
  assert.equal(storage.getItem("delimt_ref"),null);
  assert.equal(calls.filter(x=>x[0]==="update").length,0);
});
test("temporary database errors keep the pending invitation for a later retry",async()=>{
  const {client}=fixture({updateError:{code:"08006",message:"private server detail"}});const storage=memory();
  assert.equal(await applyPendingReferral(client,"owner",storage),"retry");
  assert.equal(storage.getItem("delimt_ref"),"invite-code");
});
test("invalid or already-assigned invitations stop retrying without changing counters",async()=>{
  for(const code of ["22023","23514"]){
    const {client}=fixture({updateError:{code}});const storage=memory();
    assert.equal(await applyPendingReferral(client,"owner",storage),"ignored");
    assert.equal(storage.getItem("delimt_ref"),null);
  }
});
test("a newer invitation captured during an older request is not erased",async()=>{
  const storage=memory();const {client}=fixture({onUpdate:()=>storage.setItem("delimt_ref","new-link")});
  assert.equal(await applyPendingReferral(client,"owner",storage),"applied");
  assert.equal(storage.getItem("delimt_ref"),"new-link");
});
test("disabled browser storage does not break sign-in",()=>{
  const storage={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}};
  assert.equal(pendingReferral(storage),null);
  assert.doesNotThrow(()=>captureReferral(storage,"?ref=code"));
});
