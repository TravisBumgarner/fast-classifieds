import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Message from './Message'

import Typography from '@mui/material/Typography'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

const MAX_CHARS = 800

const ContactForm = ({
  fieldsToHide,
  formSuffix,
}: {
  fieldsToHide?: ('name' | 'email')[]
  formSuffix: string
}) => {
  const [success, setSuccess] = useState(false)
  const [failure, setFailure] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    website: `fast-classifieds-${formSuffix}`,
  })

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.target.name === 'message' && e.target.value.length > MAX_CHARS) {
        return
      }
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      })
    },
    [formData],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)
      const response = await fetch('https://contact-form.nfshost.com/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        setSuccess(true)
        setFormData(prev => ({
          ...prev,
          ...{
            name: '',
            email: '',
            message: '',
          },
        }))
      } else {
        setFailure(true)
      }
      setIsSubmitting(false)
    },
    [formData],
  )

  const buttonMessage = useMemo(() => {
    if (isSubmitting) return 'Sending...'
    if (success) return 'Message Sent!'
    if (failure) return 'Failed to send'
    return 'Send'
  }, [isSubmitting, success, failure])

  useEffect(() => {
    setTimeout(() => {
      if (success) {
        setSuccess(false)
      }
      if (failure) {
        setFailure(false)
      }
    }, 5000)
  }, [success, failure])

  return (
    <>
      <Box sx={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        <form
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
          }}
          onSubmit={handleSubmit}
        >
          {!fieldsToHide?.includes('name') && (
            <TextField
              placeholder="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{ display: fieldsToHide?.includes('name') ? 'none' : '' }}
            />
          )}
          {!fieldsToHide?.includes('email') && (
            <TextField
              placeholder="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              style={{ display: fieldsToHide?.includes('email') ? 'none' : '' }}
            />
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="body2" color="textSecondary">
              {formData.message.length}/{MAX_CHARS} characters
            </Typography>
          </Box>
          <TextField
            placeholder="Message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            multiline
          />
          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting || formData.message.length === 0}
          >
            {buttonMessage}
          </Button>
        </form>
        {success && (
          <Message
            includeVerticalMargin
            message="Thank you for your feedback!"
            color="success"
          />
        )}
        {failure && (
          <Message
            includeVerticalMargin
            message="Failed to send feedback. Please try again later."
            color="error"
          />
        )}
      </Box>
    </>
  )
}

export default ContactForm
