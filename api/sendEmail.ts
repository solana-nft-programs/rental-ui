import { info } from 'next/dist/build/output/log'
import { Client } from 'postmark'
import { snakeCase } from 'change-case'

const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL
const API_TOKEN = process.env.POSTMARK_API_TOKEN || 'fake'

const client = new Client(API_TOKEN)

interface SendEmailInput {
  to: string
  subject: string
  text: string
}

interface TemplateModel {
  actionUrl: string
}

interface SendEmailTemplateInput {
  to: string
  templateAlias: 'welcome' | string
  payload: TemplateModel
}
/**
 * Send an email with template defined within Postmark
 *
 * @example
 * ```ts
 * sendEmailWithTemplate({
 *   to: user.email,
 *   subject: `Welcome to ${appName}!`,
 *   text: `We're happy to have you...`
 * })
 * ```
 *
 * Will call Postmark like so:
 *
 * @example
 * ```ts
 * client.sendEmailWithTemplate({
 *  "From": "sender@example.com",
 *  "To": "recipient@example.com",
 *  "TemplateAlias": "user-invitation",
 *  "TemplateModel": {
 *    "product_url": "product_url_Value",
 *    "product_name": "product_name_Value",
 *    "name": "name_Value",
 *    "invite_sender_name": "invite_sender_name_Value",
 *    "invite_sender_organization_name": "invite_sender_organization_name_Value",
 *    "action_url": "action_url_Value",
 *    "support_email": "support_email_Value",
 *    "live_chat_url": "live_chat_url_Value",
 *    "help_url": "help_url_Value",
 *    "company_name": "company_name_Value",
 *    "company_address": "company_address_Value"
 *  }
 * });
 * ```
 */

export const sendEmailWithTemplate = (input: SendEmailTemplateInput) => {
  // if (process.env.NODE_ENV === `development`) {
  //   info(`not sending email in development:`)
  //   console.log()
  //   console.log(`To: ${input.to}`)
  //   console.log(`Template: ${input.templateAlias}`)
  //   console.log()
  //   console.log(input.payload)
  //   console.log()
  //   return
  // }

  if (API_TOKEN === 'fake' || !FROM_EMAIL) {
    console.error(
      `Please specify the POSTMARK_FROM_EMAIL and POSTMARK_API_TOKEN env variables.`
    )
    return
  }

  let templateModel = {}

  for (const [key, value] of Object.entries(input.payload)) {
    // @ts-ignore
    templateModel[snakeCase(key)] = value
  }

  return client.sendEmailWithTemplate({
    From: FROM_EMAIL,
    To: input.to,
    TemplateAlias: input.templateAlias,
    TemplateModel: templateModel,
  })
}
/**
 * Send an email with Postmark
 *
 * @example
 * ```ts
 * sendEmail({
 *   to: user.email,
 *   subject: `Welcome to ${appName}!`,
 *   text: `We're happy to have you...`
 * })
 * ```
 */
export const sendEmail = (input: SendEmailInput) => {
  if (process.env.NODE_ENV === `development`) {
    info(`not sending email in development:`)
    console.log()
    console.log(`To: ${input.to}`)
    console.log(`Subject: ${input.subject}`)
    console.log()
    console.log(input.text)
    console.log()
    return
  }

  if (API_TOKEN === 'fake' || !FROM_EMAIL) {
    console.error(
      `Please specify the POSTMARK_FROM_EMAIL and POSTMARK_API_TOKEN env variables.`
    )
    return
  }

  return client.sendEmail({
    From: FROM_EMAIL,
    To: input.to,
    Subject: input.subject,
    TextBody: input.text,
  })
}
