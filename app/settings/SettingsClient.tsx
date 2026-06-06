"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  User,
  Building2,
  Bell,
  CreditCard,
  Shield,
  MessageSquare,
  Users,
  Send,
  Check
} from "lucide-react"

interface Props {
  landlordName: string
}

export function SettingsClient({ landlordName }: Props) {
  const [saved, setSaved] = useState(false)

  const initials = landlordName
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "L"

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline">Change Photo</Button>
                  <p className="text-sm text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input defaultValue={landlordName} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input placeholder="landlord@example.com" type="email" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input placeholder="+972 50 000 0000" type="tel" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input defaultValue="Administrator" disabled />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  {saved ? <><Check className="mr-2 h-4 w-4" /> Saved</> : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input type="password" placeholder="Enter current password" />
                </div>
                <div></div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline">Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input defaultValue="Landed Property Management" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Type</label>
                  <Input defaultValue="Property Management" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input placeholder="Business address" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input placeholder="Tel Aviv" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  {saved ? <><Check className="mr-2 h-4 w-4" /> Saved</> : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Email Notifications</h4>
                <div className="space-y-3">
                  {[
                    { label: "New tenant messages", description: "Get notified when tenants send messages", defaultChecked: true },
                    { label: "Maintenance requests", description: "Alerts for new repair requests", defaultChecked: true },
                    { label: "Rent reminders", description: "Notifications about upcoming rent due dates", defaultChecked: true },
                    { label: "Contract expiring", description: "Alerts when leases are about to expire", defaultChecked: true },
                    { label: "Weekly summary", description: "Weekly digest of all activity", defaultChecked: false },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <Checkbox defaultChecked={item.defaultChecked} className="mt-1" />
                      <div>
                        <label className="text-sm font-medium">{item.label}</label>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Push Notifications</h4>
                <div className="space-y-3">
                  {[
                    { label: "Urgent messages", description: "High priority tenant communications", defaultChecked: true },
                    { label: "Payment received", description: "Confirmation when payments are made", defaultChecked: true },
                    { label: "Task assignments", description: "When tasks are assigned to you", defaultChecked: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <Checkbox defaultChecked={item.defaultChecked} className="mt-1" />
                      <div>
                        <label className="text-sm font-medium">{item.label}</label>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  {saved ? <><Check className="mr-2 h-4 w-4" /> Saved</> : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Messaging Integrations</CardTitle>
              <CardDescription>Connect your messaging platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[#0088cc]/10 flex items-center justify-center">
                    <Send className="h-5 w-5 text-[#0088cc]" />
                  </div>
                  <div>
                    <h4 className="font-medium">Telegram</h4>
                    <p className="text-sm text-muted-foreground">Connect your Telegram bot</p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-[#25D366]" />
                  </div>
                  <div>
                    <h4 className="font-medium">WhatsApp Business</h4>
                    <p className="text-sm text-muted-foreground">Connect WhatsApp Business API</p>
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Integrations</CardTitle>
              <CardDescription>Connect additional services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Payment Gateway</h4>
                    <p className="text-sm text-muted-foreground">Process rent payments online</p>
                  </div>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Background Check Service</h4>
                    <p className="text-sm text-muted-foreground">Tenant screening integration</p>
                  </div>
                </div>
                <Button variant="outline">Connect</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Professional Plan</h4>
                    <Badge>Current</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Up to 50 properties, unlimited users</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">$49</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Change Plan</Button>
                <Button variant="outline">View Invoice History</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-14 rounded bg-slate-100 flex items-center justify-center text-xs font-medium">
                    VISA
                  </div>
                  <div>
                    <p className="font-medium">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
              <Button variant="outline">Add Payment Method</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your team and permissions</CardDescription>
              </div>
              <Button>Invite Member</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Sarah Chen", email: "sarah@acmeproperties.com", role: "Admin", status: "active" },
                { name: "Michael Thompson", email: "michael@acmeproperties.com", role: "Manager", status: "active" },
                { name: "Emily Davis", email: "emily@acmeproperties.com", role: "Agent", status: "active" },
                { name: "James Wilson", email: "james@acmeproperties.com", role: "Agent", status: "pending" },
              ].map((member) => (
                <div key={member.email} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {member.status === "pending" && (
                          <Badge variant="outline" className="text-amber-600">Pending</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{member.role}</Badge>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
